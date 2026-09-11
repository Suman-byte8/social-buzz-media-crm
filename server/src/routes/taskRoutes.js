import express from "express";
import { Op } from "sequelize";
import { cacheRoute } from "../middleware/cacheRoute.js";
import { invalidateCache } from "../utils/serverCache.js";
import { notify } from "../utils/realtime.js";

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

// Persists the notification (so it survives reload / shows up on the
// Notifications page) and pushes it live over the socket in the same
// shape the list endpoint returns (id + the task's current status/title/
// dueDate), so a live-received item renders with the right status color
// immediately instead of looking unstyled until the next re-fetch.
const createAndNotify = async (Notification, { type, title, message, taskId, task }) => {
  const notification = await Notification.create({ type, title, message, taskId });
  notify({ ...notification.toJSON(), task: task || null });
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
    const { Task, TeamMember, TaskAssignee, Notification } = req.app.locals.models;
    const {
      title,
      description,
      status = "todo",
      priority = "medium",
      clientId,
      assignees,
      assignedById,
      dueDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    let validAssignees = [];
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      validAssignees = await TeamMember.findAll({
        where: { id: { [Op.in]: assignees } },
        attributes: ["id", "name"],
      });
      if (validAssignees.length !== assignees.length) {
        return res.status(400).json({ success: false, message: "One or more assignee IDs are invalid" });
      }
    }
    const validIds = validAssignees.map((a) => a.id);

    const task = await Task.create({
      title,
      description: description || null,
      status: status || "todo",
      priority: priority || "medium",
      clientId: clientId ? parseInt(clientId) : null,
      assignedById: assignedById ? parseInt(assignedById) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    if (validIds.length > 0) {
      await TaskAssignee.bulkCreate(validIds.map((teamMemberId) => ({ taskId: task.id, teamMemberId })));
      for (const assigneeId of validIds) {
        await syncTeamMemberWorks(TeamMember, assigneeId, title);
      }
      await createAndNotify(Notification, {
        type: "task_assigned",
        title: "New task assigned",
        message: `"${title}" was assigned to ${validAssignees.map((a) => a.name).join(", ")}`,
        taskId: task.id,
        task: { id: task.id, title: task.title, status: task.status, dueDate: task.dueDate },
      });
    }

    await invalidateCache("tasks");
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

router.get("/tasks", cacheRoute("tasks", 30), async (req, res) => {
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
      assignedDate,
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

    // Filters by when the task was assigned (createdAt) rather than its due
    // date — tasks aren't given a separate "assigned at" timestamp; they're
    // created together with their assignees in one shot (see POST /tasks
    // below), so createdAt already is the assigned date.
    if (assignedDate && /^\d{4}-\d{2}-\d{2}$/.test(assignedDate)) {
      const [year, monthNum, day] = assignedDate.split("-").map(Number);
      const rangeStart = new Date(Date.UTC(year, monthNum - 1, day));
      const rangeEnd = new Date(Date.UTC(year, monthNum - 1, day + 1));
      where.createdAt = { [Op.gte]: rangeStart, [Op.lt]: rangeEnd };
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
    const assignedByIds = taskList.map((t) => t.assignedById).filter(Boolean);
    const memberIds = [...new Set([...assigneeLinks.map((l) => l.teamMemberId), ...assignedByIds])];
    const teamMembers = await TeamMember.findAll({
      where: { id: { [Op.in]: memberIds.length > 0 ? memberIds : [-1] } },
      attributes: ["id", "name", "avatar"],
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
        assignedByMember: t.assignedById ? teamMemberById.get(t.assignedById) || null : null,
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
          attributes: ["id", "name", "designation", "department", "avatar"],
        })
      : [];

    const assignedByMember = taskFields.assignedById
      ? await TeamMember.findByPk(taskFields.assignedById, {
          attributes: ["id", "name", "designation", "department", "avatar"],
        })
      : null;

    res.json({
      success: true,
      data: {
        ...taskFields,
        assignees: memberIds,
        assigneeDetails,
        assignedByMember,
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
    const { Task, TeamMember, TaskAssignee, Notification } = req.app.locals.models;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { title, description, status, priority, clientId, assignees, assignedById, dueDate, completedAt } = req.body;

    const oldLinks = await TaskAssignee.findAll({ where: { taskId: task.id }, attributes: ["teamMemberId"] });
    const oldAssigneeIds = oldLinks.map((l) => l.teamMemberId);

    const updateData = {
      title: title ?? task.title,
      description: description !== undefined ? description : task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      // clientId/dueDate/completedAt are legitimately cleared by sending
      // `null` (e.g. an internal task with no client, or a cleared due
      // date) — treating that the same as "field omitted" and running it
      // through parseInt()/new Date() produced NaN / epoch dates, and
      // Postgres rejects NaN for an INTEGER column outright, which is what
      // made every update to a client-less task fail with a 500.
      clientId: clientId !== undefined ? (clientId === null || clientId === "" ? null : parseInt(clientId)) : task.clientId,
      assignedById:
        assignedById !== undefined ? (assignedById === null || assignedById === "" ? null : parseInt(assignedById)) : task.assignedById,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      completedAt: completedAt !== undefined
        ? (completedAt ? new Date(completedAt) : null)
        : status === "completed" && task.status !== "completed"
        ? new Date()
        : status !== "completed"
        ? null
        : task.completedAt,
    };

    await task.update(updateData);

    // Same NaN-into-INTEGER-column hazard as clientId above: filter out
    // anything that doesn't parse to a real number before it ever reaches
    // TaskAssignee.bulkCreate, whose teamMemberId column is NOT NULL and
    // part of a composite primary key — Postgres rejects NaN outright.
    const assigneesProvided = assignees !== undefined && Array.isArray(assignees);
    const newAssigneeIds = assigneesProvided
      ? [...new Set(assignees.map((id) => parseInt(id)).filter((id) => Number.isInteger(id)))]
      : oldAssigneeIds;

    if (assigneesProvided) {
      await TaskAssignee.destroy({ where: { taskId: task.id } });
      if (newAssigneeIds.length > 0) {
        await TaskAssignee.bulkCreate(newAssigneeIds.map((teamMemberId) => ({ taskId: task.id, teamMemberId })));
      }
    }

    const addedAssigneeIds = newAssigneeIds.filter((id) => !oldAssigneeIds.includes(id));
    for (const assigneeId of addedAssigneeIds) {
      await syncTeamMemberWorks(TeamMember, assigneeId, task.title);
    }

    for (const oldId of oldAssigneeIds) {
      if (!newAssigneeIds.includes(oldId)) {
        await removeTaskFromTeamMember(TeamMember, oldId, task.title);
      }
    }

    if (addedAssigneeIds.length > 0) {
      const addedMembers = await TeamMember.findAll({
        where: { id: { [Op.in]: addedAssigneeIds } },
        attributes: ["name"],
      });
      await createAndNotify(Notification, {
        type: "task_assigned",
        title: "Task assigned",
        message: `"${task.title}" was assigned to ${addedMembers.map((a) => a.name).join(", ")}`,
        taskId: task.id,
        task: { id: task.id, title: task.title, status: task.status, dueDate: task.dueDate },
      });
    }

    // syncTeamMemberWorks/removeTaskFromTeamMember above may have edited
    // assignedWorks on affected TeamMember rows.
    await invalidateCache("tasks");
    if (assigneesProvided) await invalidateCache("team");

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { ...task.toJSON(), assignees: newAssigneeIds },
    });
  } catch (error) {
    console.error("Error updating task:", error);
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
    if (links.length > 0) await invalidateCache("team");

    // task_assignees rows for this task cascade-delete automatically
    // (ON DELETE CASCADE — see scripts/migrate-task-assignees.js).
    await task.destroy();
    await invalidateCache("tasks");
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
