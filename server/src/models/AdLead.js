import { DataTypes } from "sequelize";

// A lead captured by a Meta Lead Ad form or a Google Ads lead form, stored
// exactly as received. Each new row also creates an ordinary CRM Lead
// (linked through `leadId`), so it shows up on the Leads page.
const adLeadModel = (sequelize) => {
  const AdLead = sequelize.define(
    "AdLead",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      platform: { type: DataTypes.STRING, allowNull: false },
      externalLeadId: { type: DataTypes.STRING, allowNull: false },
      // Resolved through the campaign when possible; null if that campaign
      // hasn't been synced yet.
      adAccountId: { type: DataTypes.INTEGER, allowNull: true },
      externalCampaignId: { type: DataTypes.STRING, allowNull: true },
      campaignName: { type: DataTypes.STRING(512), allowNull: true },
      externalAdId: { type: DataTypes.STRING, allowNull: true },
      formId: { type: DataTypes.STRING, allowNull: true },
      formName: { type: DataTypes.STRING, allowNull: true },
      fullName: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      // Every form answer, keyed by question/field name.
      answers: { type: DataTypes.JSONB, allowNull: true },
      isTest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      leadCreatedAt: { type: DataTypes.DATE, allowNull: true },
      leadId: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "ad_leads",
      indexes: [
        { unique: true, fields: ["platform", "externalLeadId"] },
        { fields: ["adAccountId"] },
        { fields: ["leadCreatedAt"] },
      ],
    }
  );

  return AdLead;
};

export default adLeadModel;
