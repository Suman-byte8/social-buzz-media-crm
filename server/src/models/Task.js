import { DataTypes } from "sequelize";

const taskModel = (sequelize) => {
  const Task = sequelize.define(
    "Task",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "todo",
        validate: {
          isIn: {
            args: [["todo", "in_progress", "in_progress", "review", "completed"]],
            msg: "Status must be one of: todo, in_progress, review, completed",
          },
        },
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "medium",
        validate: {
          isIn: {
            args: [["urgent", "high", "medium", "low"]],
            msg: "Priority must be one of: urgent, high, medium, low",
          },
        },
      },
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      assignees: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      dueDate: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
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
      tableName: "tasks",
      indexes: [
        { fields: ["clientId"] },
        { fields: ["status"] },
        { fields: ["priority"] },
      ],
    }
  );

  return Task;
};

export default taskModel;
