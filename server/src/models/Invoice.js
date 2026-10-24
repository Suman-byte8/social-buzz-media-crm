import { DataTypes } from "sequelize";

// The real, persisted invoice record — distinct from the older client-side-
// only "Invoice Builder" (client/src/components/invoices/*), which never
// wrote anything to the database. All money fields are INTEGER paise (no
// floats) per this module's own convention — see paymentCalculations.js,
// the only place that computes totals/statuses server-side.
//
// Editable only while status is "draft" (enforced in paymentRoutes.js, not
// here) — once issued, a correction goes through void + duplicate-as-draft
// rather than silently mutating an issued invoice's figures.
const invoiceModel = (sequelize) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      // Soft reference (constraints: false, see models/index.js) — null for
      // ad-hoc invoices not generated from a recurring billing plan.
      billingConfigId: { type: DataTypes.INTEGER, allowNull: true },
      // "SBM/INV/2026/001" — generated once at creation (see
      // invoiceNumbering.js), never regenerated, unique.
      invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM("draft", "issued", "partially_paid", "paid", "overdue", "void"),
        allowNull: false,
        defaultValue: "draft",
      },
      invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
      dueDate: { type: DataTypes.DATEONLY, allowNull: false },
      // Set only for invoices generated from a recurring billing plan — the
      // period this invoice actually bills for, distinct from invoiceDate
      // (when it was issued). A unique index on (billingConfigId,
      // billingPeriodStart) is what prevents duplicate recurring invoices.
      billingPeriodStart: { type: DataTypes.DATEONLY, allowNull: true },
      billingPeriodEnd: { type: DataTypes.DATEONLY, allowNull: true },
      subtotalPaise: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      discountPaise: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      taxPaise: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // Rounding adjustment (within ±50 paise) applied after tax when an
      // invoice is rounded to the nearest rupee — see computeInvoiceTotals.
      roundOffPaise: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalPaise: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // Transactionally-maintained cache, recomputed from PaymentAllocation
      // rows by recomputeInvoiceFromAllocations() on every allocation
      // change — never set directly from client input.
      amountPaidPaise: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "INR" },
      notes: { type: DataTypes.TEXT, allowNull: true },
      termsText: { type: DataTypes.TEXT, allowNull: true },
      voidReason: { type: DataTypes.TEXT, allowNull: true },
      voidedAt: { type: DataTypes.DATE, allowNull: true },
      // Optimistic concurrency, same pattern as Agreement.revision.
      revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      updatedBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "invoices",
      indexes: [
        { fields: ["clientId"] },
        { fields: ["status"] },
        { fields: ["billingConfigId"] },
        { fields: ["dueDate"] },
        { unique: true, fields: ["billingConfigId", "billingPeriodStart"], name: "invoices_billing_period_unique" },
      ],
    }
  );

  return Invoice;
};

export default invoiceModel;
