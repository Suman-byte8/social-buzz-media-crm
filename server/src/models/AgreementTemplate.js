import { DataTypes } from "sequelize";

// User-saved reusable agreement templates ("Save as template" from the
// editor) — mirrors ReportTemplate.js. The one master template (the SBM
// Service Agreement) is NOT a row here; it ships as a static definition in
// server/src/utils/agreementTemplates.js, exactly like Report's 8 built-ins.
// Only templates a user explicitly saves need to persist here.
const agreementTemplateModel = (sequelize) => {
  const AgreementTemplate = sequelize.define(
    "AgreementTemplate",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Same shape/convention as Agreement.documentData.
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
      tableName: "agreement_templates",
      indexes: [{ fields: ["isShared"] }],
    }
  );

  return AgreementTemplate;
};

export default agreementTemplateModel;
