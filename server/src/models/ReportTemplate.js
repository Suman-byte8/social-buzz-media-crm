import { DataTypes } from "sequelize";

// User-saved reusable report templates ("Save as template" from the
// editor). The 8 built-in starter templates are NOT rows in this table —
// they ship as static definitions in the client (reportTemplates.js),
// exactly like invoiceDefaults.js/salarySlipDefaults.js — only templates a
// user explicitly saves need to persist here.
const reportTemplateModel = (sequelize) => {
  const ReportTemplate = sequelize.define(
    "ReportTemplate",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Same shape/convention as Report.documentData.
      documentData: { type: DataTypes.TEXT, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: true },
      // Private (only the creator sees it) vs shared (every authenticated
      // user sees it) — the only visibility distinction this CRM's
      // permission model supports elsewhere (e.g. brand kits are
      // implicitly shared, personal drafts are not).
      isShared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isDefaultForCategory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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
      tableName: "report_templates",
      indexes: [{ fields: ["category"] }, { fields: ["isShared"] }],
    }
  );

  return ReportTemplate;
};

export default reportTemplateModel;
