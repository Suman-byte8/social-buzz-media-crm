import { DataTypes } from "sequelize";

// An append-only audit trail for one Agreement — who did what and when.
// Written by agreementBuilderRoutes.js at each meaningful action (never
// edited/deleted afterward), giving the editor's Activity panel a simple
// read-only timeline.
const agreementActivityLogModel = (sequelize) => {
  const AgreementActivityLog = sequelize.define(
    "AgreementActivityLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Soft reference (constraints: false, see models/index.js).
      agreementId: { type: DataTypes.INTEGER, allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      userName: { type: DataTypes.STRING, allowNull: true },
      // Free-form JSON-in-TEXT (e.g. {"from":"draft","to":"sent"} for a
      // status_changed entry) — same stringify/parse convention used
      // elsewhere in this codebase rather than a native JSONB column.
      metadata: { type: DataTypes.TEXT, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "agreement_activity_logs",
      updatedAt: false,
      indexes: [{ fields: ["agreementId"] }],
    }
  );

  return AgreementActivityLog;
};

export default agreementActivityLogModel;
