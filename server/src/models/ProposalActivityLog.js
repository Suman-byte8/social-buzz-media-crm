import { DataTypes } from "sequelize";

// An append-only audit trail for one Proposal — who did what and when.
// Mirrors AgreementActivityLog.js exactly.
const proposalActivityLogModel = (sequelize) => {
  const ProposalActivityLog = sequelize.define(
    "ProposalActivityLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Soft reference (constraints: false, see models/index.js).
      proposalId: { type: DataTypes.INTEGER, allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      userName: { type: DataTypes.STRING, allowNull: true },
      // Free-form JSON-in-TEXT (e.g. {"from":"draft","to":"sent"} for a
      // status_changed entry) — same convention used elsewhere.
      metadata: { type: DataTypes.TEXT, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "proposal_activity_logs",
      updatedAt: false,
      indexes: [{ fields: ["proposalId"] }],
    }
  );

  return ProposalActivityLog;
};

export default proposalActivityLogModel;
