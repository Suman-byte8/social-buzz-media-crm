import { DataTypes } from "sequelize";

// The ledger's actual source of truth. One Payment can have several
// allocation rows; each points at an invoiceId OR is unallocated
// (invoiceId: null = "advance"/available credit). The invariant
// paymentCalculations.js and every write path in paymentRoutes.js
// preserves: SUM(allocations for a payment) never exceeds that payment's
// amountPaise.
//
// "Applying advance credit to an invoice" never creates a new Payment — it
// reduces an existing invoiceId:null row and creates/increases a new
// invoiceId:X row for the same amount, inside one transaction, so the total
// across a payment's allocations never changes. This is what makes an
// advance-application provably NOT a second cash receipt.
const paymentAllocationModel = (sequelize) => {
  const PaymentAllocation = sequelize.define(
    "PaymentAllocation",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      paymentId: { type: DataTypes.INTEGER, allowNull: false },
      // Soft reference (constraints: false, see models/index.js) — null
      // means this slice of the payment is unallocated advance.
      invoiceId: { type: DataTypes.INTEGER, allowNull: true },
      amountPaise: { type: DataTypes.INTEGER, allowNull: false },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "payment_allocations",
      updatedAt: false,
      indexes: [{ fields: ["paymentId"] }, { fields: ["invoiceId"] }],
    }
  );

  return PaymentAllocation;
};

export default paymentAllocationModel;
