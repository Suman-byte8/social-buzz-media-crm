import { DataTypes } from "sequelize";

// One day of performance for one campaign (level "campaign"; the column is
// there so ad set / ad level rows can be added later without a new table).
// The sync re-pulls recent days and upserts on the unique key, because both
// platforms keep revising conversions for days after the fact.
//
// Ratios (CTR, CPC, CPM, cost per lead) are deliberately NOT stored — they
// are computed from these sums at read time so they stay correct for any
// date range. `reach` is stored per day but can't be summed across days.
const adDailyMetricModel = (sequelize) => {
  const AdDailyMetric = sequelize.define(
    "AdDailyMetric",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      adAccountId: { type: DataTypes.INTEGER, allowNull: false },
      level: { type: DataTypes.STRING, allowNull: false, defaultValue: "campaign" },
      externalId: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      impressions: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      clicks: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      // Account-currency minor units (paise for INR).
      spendMinor: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: true },
      reach: { type: DataTypes.BIGINT, allowNull: true },
      conversions: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      conversionValueMinor: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      leads: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // Platform extras not mapped to a column (e.g. Meta's full actions[] list).
      extra: { type: DataTypes.JSONB, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "ad_daily_metrics",
      indexes: [
        { unique: true, fields: ["adAccountId", "level", "externalId", "date"] },
        { fields: ["date"] },
      ],
    }
  );

  return AdDailyMetric;
};

export default adDailyMetricModel;
