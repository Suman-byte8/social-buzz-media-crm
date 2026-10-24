import { DataTypes } from "sequelize";

// A follow-up note and/or reminder-sent log entry against one overdue/
// outstanding invoice — covers both "add a follow-up note" and "mark a
// reminder as sent" from the Outstanding Dues view.
const paymentReminderModel = (sequelize) => {
  const PaymentReminder = sequelize.define(
    "PaymentReminder",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoiceId: { type: DataTypes.INTEGER, allowNull: false },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "completed"),
        allowNull: false,
        defaultValue: "pending",
      },
      // Set only when this row represents an actual reminder send (not a
      // plain follow-up note) — "manual" covers a copied reminder text the
      // user sent some other way (phone call, in person, etc.).
      sentVia: { type: DataTypes.ENUM("email", "whatsapp", "manual"), allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "payment_reminders",
      indexes: [{ fields: ["invoiceId"] }, { fields: ["clientId"] }, { fields: ["status"] }],
    }
  );

  return PaymentReminder;
};

export default paymentReminderModel;
