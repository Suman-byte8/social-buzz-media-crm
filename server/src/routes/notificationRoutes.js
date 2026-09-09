import express from "express";

const router = express.Router();

// GET /api/notifications - paginated, newest first, enriched with the
// related task's *current* status/title/dueDate (not a frozen snapshot) so
// the UI can color-code by where the task actually stands today.
router.get("/notifications", async (req, res) => {
  try {
    const { Notification, Task } = req.app.locals.models;
    const { page = 1, limit = 20, unread } = req.query;

    const where = {};
    if (unread === "true") where.read = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [{ model: Task, as: "task", attributes: ["id", "title", "status", "dueDate"] }],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications", error: error.message });
  }
});

// GET /api/notifications/unread-count - cheap indexed count for the bell badge.
router.get("/notifications/unread-count", async (req, res) => {
  try {
    const { Notification } = req.app.locals.models;
    const count = await Notification.count({ where: { read: false } });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error counting notifications", error: error.message });
  }
});

// PUT /api/notifications/read-all
router.put("/notifications/read-all", async (req, res) => {
  try {
    const { Notification } = req.app.locals.models;
    await Notification.update({ read: true }, { where: { read: false } });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notifications", error: error.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/notifications/:id/read", async (req, res) => {
  try {
    const { Notification } = req.app.locals.models;
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    await notification.update({ read: true });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notification", error: error.message });
  }
});

// DELETE /api/notifications/:id
router.delete("/notifications/:id", async (req, res) => {
  try {
    const { Notification } = req.app.locals.models;
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    await notification.destroy();
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting notification", error: error.message });
  }
});

// DELETE /api/notifications - clear everything (the page's "Clear all").
router.delete("/notifications", async (req, res) => {
  try {
    const { Notification } = req.app.locals.models;
    await Notification.destroy({ where: {}, truncate: true });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error clearing notifications", error: error.message });
  }
});

export default router;
