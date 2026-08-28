import { DataTypes } from "sequelize";

// Join table for Task <-> TeamMember. Replaces the old `tasks.assignees`
// JSON-in-TEXT column, which had to be filtered with fragile OR'd LIKE
// patterns and could never use an index (see scripts/migrate-task-assignees.js
// for the one-time backfill from that column).
const taskAssigneeModel = (sequelize) => {
  const TaskAssignee = sequelize.define(
    "TaskAssignee",
    {
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "tasks", key: "id" },
      },
      teamMemberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "team_members", key: "id" },
      },
    },
    {
      tableName: "task_assignees",
      timestamps: false,
      indexes: [{ fields: ["taskId"] }, { fields: ["teamMemberId"] }],
    }
  );

  return TaskAssignee;
};

export default taskAssigneeModel;
