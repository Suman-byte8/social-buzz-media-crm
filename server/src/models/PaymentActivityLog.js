import { DataTypes } from "sequelize";

// An append-only audit trail for one client's financial activity — invoice
// created/issued/voided, payment recorded/reversed, allocation applied,
// refund issued, billing plan changed, reminder sent, etc. Mirrors
// AgreementActivityLog.js/ProposalActivityLog.js exactly. Never edited or
// deleted; a mistaken entry is corrected by a new offsetting event, not by
// altering this row.
const paymentActivityLogModel = (sequelize) => {
  const PaymentActivityLog = sequelize.define(
    "PaymentActivityLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Soft references (constraints: false, see models/index.js).
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      invoiceId: { type: DataTypes.INTEGER, allowNull: true },
      paymentId: { type: DataTypes.INTEGER, allowNull: true },
      action: { type: DataTypes.STRING, allowNull: false },
      userName: { type: DataTypes.STRING, allowNull: true },
      amountPaise: { type: DataTypes.INTEGER, allowNull: true },
      // Free-form JSON-in-TEXT, same convention as Agreement/ProposalActivityLog.
      metadata: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "payment_activity_logs",
      updatedAt: false,
      indexes: [{ fields: ["clientId"] }, { fields: ["invoiceId"] }, { fields: ["paymentId"] }],
    }
  );

  return PaymentActivityLog;
};

export default paymentActivityLogModel;
