import { DataTypes } from "sequelize";

// User-saved reusable proposal templates ("Save as template" from the
// editor) — mirrors AgreementTemplate.js. The one master template (the SBM
// Proposal) is NOT a row here; it ships as a static definition in
// server/src/utils/proposalTemplates.js. Only templates a user explicitly
// saves need to persist here.
const proposalTemplateModel = (sequelize) => {
  const ProposalTemplate = sequelize.define(
    "ProposalTemplate",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Same shape/convention as Proposal.documentData.
      documentData: { type: DataTypes.TEXT, allowNull: false },
      isShared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdBy: { type: DataTypes.STRING, allowNull: true },
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
      tableName: "proposal_templates",
      indexes: [{ fields: ["isShared"] }],
    }
  );

  return ProposalTemplate;
};

export default proposalTemplateModel;
