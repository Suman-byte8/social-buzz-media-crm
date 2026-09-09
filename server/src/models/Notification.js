import { DataTypes } from "sequelize";

// Persisted record of a live notification (see utils/realtime.js's notify()
// for the Socket.io push side). taskId is a soft reference (no DB-level FK,
// same convention as Task.clientId/Document.clientId) — a notification
// should keep showing as a historical record even if the task it refers to
// is later deleted, so this deliberately doesn't cascade.
const notificationModel = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING, allowNull: false, defaultValue: "task_assigned" },
      title: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: true },
      taskId: { type: DataTypes.INTEGER, allowNull: true },
      read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "notifications",
      indexes: [{ fields: ["read"] }, { fields: ["createdAt"] }, { fields: ["taskId"] }],
    }
  );

  return Notification;
};

export default notificationModel;
