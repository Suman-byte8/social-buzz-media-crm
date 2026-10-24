import { DataTypes } from "sequelize";

// One priced service under a client's billing configuration (e.g. "Social
// Media Management" monthly, "Website Setup" one-time) — lets a client have
// several differently-priced services under one billing config instead of
// forcing a single flat monthly fee.
const clientBillingPlanItemModel = (sequelize) => {
  const ClientBillingPlanItem = sequelize.define(
    "ClientBillingPlanItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      billingConfigId: { type: DataTypes.INTEGER, allowNull: false },
      serviceName: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      amountPaise: { type: DataTypes.INTEGER, allowNull: false },
      // true = a one-time charge (billed once, e.g. on the next generated
      // invoice, then expected to be removed/disabled by the user) rather
      // than part of the recurring monthly/quarterly/etc. total.
      isOneTime: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "client_billing_plan_items",
      indexes: [{ fields: ["billingConfigId"] }],
    }
  );

  return ClientBillingPlanItem;
};

export default clientBillingPlanItemModel;
