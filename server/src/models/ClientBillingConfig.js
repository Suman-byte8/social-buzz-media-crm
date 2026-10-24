import { DataTypes } from "sequelize";

// One evolving billing configuration per client (1:1 — clientId is unique),
// stored separately from any issued Invoice so changing a price or
// frequency here never silently modifies historical invoices (those keep
// their own frozen InvoiceLineItem rows). Services/prices live on the
// child ClientBillingPlanItem model.
const clientBillingConfigModel = (sequelize) => {
  const ClientBillingConfig = sequelize.define(
    "ClientBillingConfig",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      billingFrequency: {
        type: DataTypes.ENUM("monthly", "quarterly", "half_yearly", "yearly", "one_time"),
        allowNull: false,
        defaultValue: "monthly",
      },
      billingStartDate: { type: DataTypes.DATEONLY, allowNull: true },
      // Day of month a recurring invoice's billing period starts — kept to
      // 1-28 so every month (including February) has that day, avoiding
      // month-end edge cases.
      billingDay: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 28 } },
      dueInDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
      // Basis points (1800 = 18.00%) — integer, no float tax-rate math.
      taxRateBasisPoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM("active", "paused", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      updatedBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "client_billing_configs",
    }
  );

  return ClientBillingConfig;
};

export default clientBillingConfigModel;
