import { DataTypes } from "sequelize";

// Latest known settings of one campaign. Performance numbers live in
// AdDailyMetric, never here — this row is overwritten on every sync.
const adCampaignModel = (sequelize) => {
  const AdCampaign = sequelize.define(
    "AdCampaign",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      adAccountId: { type: DataTypes.INTEGER, allowNull: false },
      platform: { type: DataTypes.STRING, allowNull: false },
      externalCampaignId: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING(512), allowNull: true },
      status: { type: DataTypes.STRING, allowNull: true },
      // Google advertising_channel_type (SEARCH, DISPLAY, PERFORMANCE_MAX…)
      // or Meta objective (OUTCOME_LEADS, OUTCOME_SALES…).
      objective: { type: DataTypes.STRING, allowNull: true },
      // Account-currency minor units (paise for INR), same convention as Payments.
      dailyBudgetMinor: { type: DataTypes.BIGINT, allowNull: true },
      lifetimeBudgetMinor: { type: DataTypes.BIGINT, allowNull: true },
      startDate: { type: DataTypes.DATEONLY, allowNull: true },
      endDate: { type: DataTypes.DATEONLY, allowNull: true },
      raw: { type: DataTypes.JSONB, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "ad_campaigns",
      indexes: [{ unique: true, fields: ["platform", "externalCampaignId"] }, { fields: ["adAccountId"] }],
    }
  );

  return AdCampaign;
};

export default adCampaignModel;
