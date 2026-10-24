import { DataTypes } from "sequelize";

// One priced line on an Invoice — a frozen snapshot at the time the invoice
// was created, independent of ClientBillingPlanItem (so editing a client's
// billing plan later never silently changes a past invoice's figures).
const invoiceLineItemModel = (sequelize) => {
  const InvoiceLineItem = sequelize.define(
    "InvoiceLineItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoiceId: { type: DataTypes.INTEGER, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      unitPricePaise: { type: DataTypes.INTEGER, allowNull: false },
      lineTotalPaise: { type: DataTypes.INTEGER, allowNull: false },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "invoice_line_items",
      indexes: [{ fields: ["invoiceId"] }],
    }
  );

  return InvoiceLineItem;
};

export default invoiceLineItemModel;
