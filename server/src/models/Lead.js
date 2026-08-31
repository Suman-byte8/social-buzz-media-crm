import { DataTypes } from "sequelize";

const leadModel = (sequelize) => {
  const Lead = sequelize.define(
    "Lead",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      companyName: { type: DataTypes.STRING, allowNull: false },
      contactName: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      // Free-text rather than a DB enum on purpose — new sources shouldn't
      // ever need a schema migration to add.
      source: { type: DataTypes.STRING, allowNull: true },
      // Plain STRING + app-level validation instead of a Postgres native
      // ENUM — adding a new status later (e.g. content-calendar's "status"
      // column) is then just an edit to this array, not a live-DB migration.
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "new",
        validate: {
          isIn: {
            args: [["new", "contacted", "qualified", "hot", "lost"]],
            msg: "Status must be one of: new, contacted, qualified, hot, lost",
          },
        },
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      lastContactAt: { type: DataTypes.DATE, allowNull: true },
      nextFollowUpAt: { type: DataTypes.DATE, allowNull: true },
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
      tableName: "leads",
      indexes: [{ fields: ["status"] }, { fields: ["nextFollowUpAt"] }],
    }
  );

  return Lead;
};

export default leadModel;
