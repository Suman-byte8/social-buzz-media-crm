import { DataTypes } from "sequelize";

// One Google Ads customer account or Meta ad account the agency's API
// credentials can see. Rows are discovered by the sync job (never typed in
// by hand); the only fields a person edits are `clientId` (which CRM client
// this account's spend belongs to) and `syncEnabled`.
const adAccountModel = (sequelize) => {
  const AdAccount = sequelize.define(
    "AdAccount",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      platform: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: { args: [["google_ads", "meta"]], msg: "platform must be google_ads or meta" } },
      },
      // Google: customer id, digits only ("1234567890").
      // Meta: "act_" + account id ("act_1234567890").
      externalAccountId: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: true },
      currency: { type: DataTypes.STRING(3), allowNull: true },
      // Report dates from both platforms are in the account's own timezone.
      timezone: { type: DataTypes.STRING, allowNull: true },
      // Platform-reported state, e.g. ENABLED / ACTIVE / DISABLED / CLOSED.
      status: { type: DataTypes.STRING, allowNull: true },
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      syncEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
      lastSyncError: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "ad_accounts",
      indexes: [
        { unique: true, fields: ["platform", "externalAccountId"] },
        { fields: ["clientId"] },
      ],
    }
  );

  return AdAccount;
};

export default adAccountModel;
