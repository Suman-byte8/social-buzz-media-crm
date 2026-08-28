import express from "express";
import { Op } from "sequelize";

const router = express.Router();

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
    const { Task, TeamMember, TaskAssignee } = req.app.locals.models;
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

    let validIds = [];
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      const validAssignees = await TeamMember.findAll({
        where: { id: { [Op.in]: assignees } },
        attributes: ["id"],
      });
      validIds = validAssignees.map((a) => a.id);
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
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    if (validIds.length > 0) {
      await TaskAssignee.bulkCreate(validIds.map((teamMemberId) => ({ taskId: task.id, teamMemberId })));
      for (const assigneeId of validIds) {
        await syncTeamMemberWorks(TeamMember, assigneeId, title);
      }
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { ...task.toJSON(), assignees: validIds },
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
    const { Task, Client, TeamMember, TaskAssignee } = req.app.locals.models;
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
      const links = await TaskAssignee.findAll({
        where: { teamMemberId: parseInt(assigneeId) },
        attributes: ["taskId"],
      });
      const matchingTaskIds = links.map((l) => l.taskId);
      // No matches -> a filter no id can satisfy, so the main query returns nothing.
      where.id = { [Op.in]: matchingTaskIds.length > 0 ? matchingTaskIds : [-1] };
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
    const taskIds = taskList.map((t) => t.id);

    const assigneeLinks = await TaskAssignee.findAll({
      where: { taskId: { [Op.in]: taskIds.length > 0 ? taskIds : [-1] } },
    });
    const memberIds = [...new Set(assigneeLinks.map((l) => l.teamMemberId))];
    const teamMembers = await TeamMember.findAll({
      where: { id: { [Op.in]: memberIds.length > 0 ? memberIds : [-1] } },
      attributes: ["id", "name"],
    });
    const teamMemberById = new Map(teamMembers.map((m) => [m.id, m]));

    const assigneeIdsByTask = new Map();
    for (const link of assigneeLinks) {
      if (!assigneeIdsByTask.has(link.taskId)) assigneeIdsByTask.set(link.taskId, []);
      assigneeIdsByTask.get(link.taskId).push(link.teamMemberId);
    }

    const enrichedTasks = taskList.map((t) => {
      const { client, ...taskFields } = t;
      const assigneeIds = assigneeIdsByTask.get(t.id) || [];
      const taskAssignees = assigneeIds.map((id) => teamMemberById.get(id)).filter(Boolean);
      return {
        ...taskFields,
        assignees: assigneeIds,
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
    const { Task, Client, TeamMember, TaskAssignee } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Client, as: "client", attributes: ["id", "name", "industry"] }],
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { client, ...taskFields } = task.toJSON();

    const links = await TaskAssignee.findAll({ where: { taskId: task.id }, attributes: ["teamMemberId"] });
    const memberIds = links.map((l) => l.teamMemberId);

    const assigneeDetails = memberIds.length > 0
      ? await TeamMember.findAll({
          where: { id: { [Op.in]: memberIds } },
          attributes: ["id", "name", "designation", "department"],
        })
      : [];

    res.json({
      success: true,
      data: {
        ...taskFields,
        assignees: memberIds,
        assigneeDetails,
        client: client || null,
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
    const { Task, TeamMember, TaskAssignee } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { title, description, status, priority, clientId, assignees, dueDate, completedAt } = req.body;

    const oldLinks = await TaskAssignee.findAll({ where: { taskId: task.id }, attributes: ["teamMemberId"] });
    const oldAssigneeIds = oldLinks.map((l) => l.teamMemberId);

    const updateData = {
      title: title ?? task.title,
      description: description !== undefined ? description : task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      clientId: clientId !== undefined ? parseInt(clientId) : task.clientId,
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

    const assigneesProvided = assignees !== undefined && Array.isArray(assignees);
    const newAssigneeIds = assigneesProvided ? assignees.map((id) => parseInt(id)) : oldAssigneeIds;

    if (assigneesProvided) {
      await TaskAssignee.destroy({ where: { taskId: task.id } });
      if (newAssigneeIds.length > 0) {
        await TaskAssignee.bulkCreate(newAssigneeIds.map((teamMemberId) => ({ taskId: task.id, teamMemberId })));
      }
    }

    for (const assigneeId of newAssigneeIds) {
      if (!oldAssigneeIds.includes(assigneeId)) {
        await syncTeamMemberWorks(TeamMember, assigneeId, task.title);
      }
    }

    for (const oldId of oldAssigneeIds) {
      if (!newAssigneeIds.includes(oldId)) {
        await removeTaskFromTeamMember(TeamMember, oldId, task.title);
      }
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { ...task.toJSON(), assignees: newAssigneeIds },
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
    const { Task, TeamMember, TaskAssignee } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const links = await TaskAssignee.findAll({ where: { taskId: task.id }, attributes: ["teamMemberId"] });
    for (const link of links) {
      await removeTaskFromTeamMember(TeamMember, link.teamMemberId, task.title);
    }

    // task_assignees rows for this task cascade-delete automatically
    // (ON DELETE CASCADE — see scripts/migrate-task-assignees.js).
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
