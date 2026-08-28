import express from "express";
import { Op } from "sequelize";

const router = express.Router();

const formatTask = (data) => ({
  ...data,
  assignees: data.assignees ? JSON.parse(data.assignees) : [],
});

const parseAssignees = (val) => {
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return Array.isArray(val) ? val : [];
  }
};

const syncTeamMemberWorks = async (TeamMember, teamMemberId, taskTitle) => {
  const member = await TeamMember.findByPk(teamMemberId);
  if (!member) return;

  let currentWorks = [];
  try {
    currentWorks = member.assignedWorks ? JSON.parse(member.assignedWorks) : [];
  } catch {
    currentWorks = Array.isArray(member.assignedWorks) ? member.assignedWorks : [];
  }

  if (!currentWorks.includes(taskTitle)) {
    currentWorks.push(taskTitle);
  }

  await member.update({
    assignedWorks: JSON.stringify(currentWorks),
  });
};

const removeTaskFromTeamMember = async (TeamMember, teamMemberId, taskTitle) => {
  const member = await TeamMember.findByPk(teamMemberId);
  if (!member) return;

  let currentWorks = [];
  try {
    currentWorks = member.assignedWorks ? JSON.parse(member.assignedWorks) : [];
  } catch {
    currentWorks = Array.isArray(member.assignedWorks) ? member.assignedWorks : [];
  }

  const filteredWorks = currentWorks.filter((w) => w !== taskTitle);

  if (filteredWorks.length === 0) {
    await member.update({ assignedWorks: null });
  } else if (filteredWorks.length !== currentWorks.length) {
    await member.update({
      assignedWorks: JSON.stringify(filteredWorks),
    });
  }
};

router.post("/tasks", async (req, res) => {
  try {
    const { Task, Client, TeamMember } = req.app.locals.models;
    const {
      title,
      description,
      status = "todo",
      priority = "medium",
      clientId,
      assignees,
      dueDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    if (assignees && Array.isArray(assignees)) {
      const validAssignees = await TeamMember.findAll({
        where: { id: { [Op.in]: assignees } },
        attributes: ["id"],
      });
      const validIds = validAssignees.map((a) => a.id);
      if (validIds.length !== assignees.length) {
        return res.status(400).json({ success: false, message: "One or more assignee IDs are invalid" });
      }
    }

    const task = await Task.create({
      title,
      description: description || null,
      status: status || "todo",
      priority: priority || "medium",
      clientId: clientId ? parseInt(clientId) : null,
      assignees: assignees && Array.isArray(assignees) && assignees.length > 0
        ? JSON.stringify(assignees)
        : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      for (const assigneeId of assignees) {
        await syncTeamMemberWorks(TeamMember, assigneeId, title);
      }
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: formatTask(task.toJSON()),
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const { Task, Client, TeamMember } = req.app.locals.models;
    const {
      page = 1,
      limit = 50,
      search = "",
      status,
      priority,
      clientId,
      assigneeId,
      month,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (clientId && clientId !== "all") {
      where.clientId = parseInt(clientId);
    }

    if (assigneeId && assigneeId !== "all") {
      const idStr = String(parseInt(assigneeId));
      where[Op.or] = [
        { assignees: { [Op.like]: `[${idStr}]` } },
        { assignees: { [Op.like]: `[${idStr},%` } },
        { assignees: { [Op.like]: `%,${idStr},%` } },
        { assignees: { [Op.like]: `%,${idStr}]` } },
        { assignees: { [Op.like]: `%, ${idStr},%` } },
        { assignees: { [Op.like]: `%, ${idStr}]` } },
      ];
    }

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, monthNum] = month.split("-").map(Number);
      const rangeStart = new Date(Date.UTC(year, monthNum - 1, 1));
      const rangeEnd = new Date(Date.UTC(year, monthNum, 1));
      where.dueDate = { [Op.gte]: rangeStart, [Op.lt]: rangeEnd };
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [{ model: Client, as: "client", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const taskList = rows.map((t) => t.toJSON());

    // `assignees` has no real foreign key (it's a JSON-serialized array of
    // ids in a TEXT column — see the LIKE-based filter above), so this side
    // still needs a manual lookup; only the client relation is a real
    // association and can go through `include`.
    const teamMembers = await TeamMember.findAll({
      where: { id: { [Op.in]: taskList.flatMap((t) => {
        const assignees = t.assignees ? JSON.parse(t.assignees) : [];
        return assignees.map((a) => parseInt(a));
      }).filter(Boolean) } },
      attributes: ["id", "name"],
    });
    const teamMemberById = new Map(teamMembers.map((m) => [m.id, m]));

    const enrichedTasks = taskList.map((t) => {
      const { client, ...taskFields } = t;
      const parsedAssignees = t.assignees ? JSON.parse(t.assignees) : [];
      const taskAssignees = parsedAssignees
        .map((id) => teamMemberById.get(Number(id)))
        .filter(Boolean);
      return {
        ...taskFields,
        assignees: parsedAssignees,
        assigneeDetails: taskAssignees,
        clientName: client ? client.name : null,
      };
    });

    res.json({
      success: true,
      data: enrichedTasks,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
});

router.get("/tasks/:id", async (req, res) => {
  try {
    const { Task, Client, TeamMember } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const taskData = task.toJSON();
    const parsedAssignees = taskData.assignees ? JSON.parse(taskData.assignees) : [];

    let assigneeDetails = [];
    if (parsedAssignees.length > 0) {
      assigneeDetails = await TeamMember.findAll({
        where: { id: { [Op.in]: parsedAssignees } },
        attributes: ["id", "name", "designation", "department"],
      });
    }

    let client = null;
    if (taskData.clientId) {
      client = await Client.findByPk(taskData.clientId, {
        attributes: ["id", "name", "industry"],
      });
    }

    res.json({
      success: true,
      data: {
        ...taskData,
        assignees: parsedAssignees,
        assigneeDetails: assigneeDetails,
        client: client,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const { Task, TeamMember } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { title, description, status, priority, clientId, assignees, dueDate, completedAt } = req.body;

    const oldAssignees = parseAssignees(task.assignees);

    const updateData = {
      title: title ?? task.title,
      description: description !== undefined ? description : task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      clientId: clientId !== undefined ? parseInt(clientId) : task.clientId,
      assignees: assignees !== undefined && Array.isArray(assignees)
        ? JSON.stringify(assignees)
        : task.assignees,
      dueDate: dueDate !== undefined ? new Date(dueDate) : task.dueDate,
      completedAt: completedAt !== undefined
        ? new Date(completedAt)
        : status === "completed" && task.status !== "completed"
        ? new Date()
        : status !== "completed"
        ? null
        : task.completedAt,
    };

    await task.update(updateData);

    const newAssigneeIds = assignees !== undefined && Array.isArray(assignees) ? assignees : oldAssignees;

    for (const assigneeId of newAssigneeIds) {
      if (!oldAssignees.includes(assigneeId)) {
        await syncTeamMemberWorks(TeamMember, assigneeId, task.title);
      }
    }

    for (const oldId of oldAssignees) {
      if (!newAssigneeIds.includes(oldId)) {
        await removeTaskFromTeamMember(TeamMember, oldId, task.title);
      }
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      data: formatTask(task.toJSON()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const { Task, TeamMember } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const taskAssignees = parseAssignees(task.assignees);
    for (const assigneeId of taskAssignees) {
      await removeTaskFromTeamMember(TeamMember, assigneeId, task.title);
    }

    await task.destroy();
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
});

export default router;
