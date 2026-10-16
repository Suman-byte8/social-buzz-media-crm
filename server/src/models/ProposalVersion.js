import { DataTypes } from "sequelize";

// A point-in-time snapshot of a Proposal's documentData — written on
// finalize and on an explicit "save version" action, NOT on every autosave
// tick. Mirrors AgreementVersion.js exactly.
const proposalVersionModel = (sequelize) => {
  const ProposalVersion = sequelize.define(
    "ProposalVersion",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Soft reference (constraints: false, see models/index.js) so a
      // version row never blocks deleting its parent Proposal.
      proposalId: { type: DataTypes.INTEGER, allowNull: false },
      versionNumber: { type: DataTypes.INTEGER, allowNull: false },
      documentData: { type: DataTypes.TEXT, allowNull: false },
      savedBy: { type: DataTypes.STRING, allowNull: true },
      note: { type: DataTypes.STRING, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "proposal_versions",
      updatedAt: false,
      indexes: [{ fields: ["proposalId"] }],
    }
  );

  return ProposalVersion;
};

export default proposalVersionModel;
