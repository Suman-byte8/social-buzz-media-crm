import { DataTypes } from "sequelize";

// One run of the ads sync for one platform. Doubles as the cross-server
// lock: a "running" row younger than the lock window means another server
// (or another click) is already syncing that platform.
const adSyncLogModel = (sequelize) => {
  const AdSyncLog = sequelize.define(
    "AdSyncLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      platform: { type: DataTypes.STRING, allowNull: false },
      // "manual" (Sync now button) or "cron" (scheduled GitHub Action).
      trigger: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "running",
        validate: { isIn: { args: [["running", "ok", "partial", "error"]], msg: "invalid sync status" } },
      },
      dateFrom: { type: DataTypes.DATEONLY, allowNull: true },
      dateTo: { type: DataTypes.DATEONLY, allowNull: true },
      accountsSynced: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      rowsUpserted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      leadsImported: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      error: { type: DataTypes.TEXT, allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      finishedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "ad_sync_logs",
      timestamps: false,
      indexes: [{ fields: ["platform", "startedAt"] }],
    }
  );

  return AdSyncLog;
};

export default adSyncLogModel;
