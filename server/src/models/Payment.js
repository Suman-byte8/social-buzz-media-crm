import { DataTypes } from "sequelize";

// One money-received event. The TOTAL amount received — how it's split
// across invoices vs. kept as unallocated advance lives in PaymentAllocation
// rows, never here (see that model's own header comment). A "reversed"
// payment is never deleted — its allocations are zeroed out transactionally
// and the row stays for audit history.
const paymentModel = (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      // The date money was actually received — distinct from createdAt
      // (when this record was entered into the CRM), which may be later.
      paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
      amountPaise: { type: DataTypes.INTEGER, allowNull: false },
      method: {
        type: DataTypes.ENUM("upi", "bank_transfer", "cash", "cheque", "razorpay", "other"),
        allowNull: false,
        defaultValue: "other",
      },
      referenceNumber: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      internalReference: { type: DataTypes.STRING, allowNull: true },
      // Soft reference to a Document row (payment proof upload), optional.
      attachmentDocumentId: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM("confirmed", "reversed"),
        allowNull: false,
        defaultValue: "confirmed",
      },
      reversalReason: { type: DataTypes.TEXT, allowNull: true },
      reversedAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "payments",
      indexes: [{ fields: ["clientId"] }, { fields: ["status"] }, { fields: ["paymentDate"] }],
    }
  );

  return Payment;
};

export default paymentModel;
