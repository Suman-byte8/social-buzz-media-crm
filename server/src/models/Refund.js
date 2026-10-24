import { DataTypes } from "sequelize";

// Money returned to a client out of their unallocated advance pool.
// Simplified/amount-level — not tied to a specific PaymentAllocation row
// (line-item-level refund tracking is deferred). Available advance is
// computed as SUM(unallocated allocations) - SUM(refunds) for the client;
// paymentRoutes.js rejects a refund that would take that negative.
const refundModel = (sequelize) => {
  const Refund = sequelize.define(
    "Refund",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      amountPaise: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: false },
      refundDate: { type: DataTypes.DATEONLY, allowNull: false },
      method: { type: DataTypes.STRING, allowNull: true },
      // Soft reference (constraints: false) — the original payment this
      // refund draws down, if the user chose to record that link.
      relatedPaymentId: { type: DataTypes.INTEGER, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "refunds",
      indexes: [{ fields: ["clientId"] }],
    }
  );

  return Refund;
};

export default refundModel;
