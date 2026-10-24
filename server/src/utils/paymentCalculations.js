// The single place all money math happens for the Payment Management
// module — nothing in paymentRoutes.js computes a total, balance, or status
// by hand, and nothing trusts a total submitted by the client. All amounts
// are integer paise throughout; there is no float arithmetic anywhere in
// this file.
import { Op, QueryTypes } from "sequelize";

const todayISO = () => new Date().toISOString().slice(0, 10);

// ── Invoice line-item totals ────────────────────────────────────────────

// discountPaise is applied before tax; taxRateBasisPoints is e.g. 1800 for
// 18.00% (basis points = percent * 100, so the whole computation stays in
// integers: taxableAmount * rateBasisPoints / 10000).
// roundToRupee mirrors the Invoice Builder's "Round off" toggle: the grand
// total is rounded to the nearest whole rupee and the difference is kept as
// its own roundOffPaise line, so the ledger total matches the printed PDF.
export function computeInvoiceTotals({ lineItems, discountPaise = 0, taxRateBasisPoints = 0, roundToRupee = false }) {
  const subtotalPaise = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPricePaise, 0);
  const taxableAmount = Math.max(subtotalPaise - discountPaise, 0);
  const taxPaise = Math.round((taxableAmount * taxRateBasisPoints) / 10000);
  const grossPaise = taxableAmount + taxPaise;
  const roundOffPaise = roundToRupee ? Math.round(grossPaise / 100) * 100 - grossPaise : 0;
  const totalPaise = grossPaise + roundOffPaise;
  return { subtotalPaise, discountPaise, taxPaise, roundOffPaise, totalPaise };
}

// ── Invoice status machine ──────────────────────────────────────────────

// Re-sums CONFIRMED allocations against this invoice (a reversed payment's
// allocation rows are excluded by the join, not deleted) and writes the
// resulting amountPaidPaise/status inside the caller's transaction. This is
// the only code path allowed to set Invoice.amountPaidPaise — it is never
// accepted directly from a request body.
export async function recomputeInvoiceFromAllocations(models, invoiceId, transaction) {
  const { Invoice, PaymentAllocation, Payment } = models;
  const invoice = await Invoice.findByPk(invoiceId, { transaction, lock: transaction ? true : undefined });
  if (!invoice) return null;

  const allocations = await PaymentAllocation.findAll({
    where: { invoiceId },
    include: [{ model: Payment, as: "payment", attributes: [], where: { status: "confirmed" }, required: true }],
    transaction,
  });
  const amountPaidPaise = allocations.reduce((sum, a) => sum + a.amountPaise, 0);

  let status = invoice.status;
  if (status !== "draft" && status !== "void") {
    if (amountPaidPaise <= 0) status = "issued";
    else if (amountPaidPaise >= invoice.totalPaise) status = "paid";
    else status = "partially_paid";
  }

  await invoice.update({ amountPaidPaise, status }, { transaction });
  return invoice;
}

// Overlay applied on top of the stored status: an issued/partially_paid
// invoice whose due date has passed and still has a balance reads (and, as
// a side effect, is opportunistically persisted as) "overdue" — without a
// separate cron. Never overrides draft/paid/void.
export function withOverdueOverlay(invoice) {
  const balance = invoice.totalPaise - invoice.amountPaidPaise;
  if (["issued", "partially_paid"].includes(invoice.status) && balance > 0 && invoice.dueDate < todayISO()) {
    return { ...invoice, status: "overdue" };
  }
  return invoice;
}

// Bulk version of the overlay above that also persists any flips in one
// query — called by the list/outstanding routes so DB-level status
// filtering (WHERE status = 'overdue') stays accurate without a cron.
export async function syncOverdueInvoices(models) {
  const { Invoice } = models;
  await Invoice.update(
    { status: "overdue" },
    {
      where: {
        status: { [Op.in]: ["issued", "partially_paid"] },
        dueDate: { [Op.lt]: todayISO() },
      },
    }
  );
}

// ── Advance balance ──────────────────────────────────────────────────────

// Available advance credit = unallocated (invoiceId: null) confirmed
// allocations, minus refunds already paid out — never cached, always
// computed fresh, so it can never drift. Raw SQL (not Model.sum() + an
// include) because both payment_allocations and payments have their own
// amountPaise column — Sequelize's .sum() helper can't qualify which one
// it means once an include joins the two, producing an ambiguous-column
// error from Postgres (confirmed by direct testing against the real DB).
export async function getClientAdvanceBalance(models, clientId) {
  const { Refund } = models;
  const sequelize = models.Invoice.sequelize;
  const rows = await sequelize.query(
    `SELECT COALESCE(SUM(pa."amountPaise"), 0) AS "unallocated"
     FROM payment_allocations pa
     JOIN payments p ON p.id = pa."paymentId"
     WHERE pa."invoiceId" IS NULL AND p."clientId" = :clientId AND p.status = 'confirmed'`,
    { replacements: { clientId }, type: QueryTypes.SELECT }
  );
  const unallocated = parseInt(rows[0]?.unallocated || 0, 10);
  const refunded = await Refund.sum("amountPaise", { where: { clientId } });
  return Math.max(unallocated - (refunded || 0), 0);
}

// ── Per-client summary (drawer detail view) ─────────────────────────────

export async function getClientFinancialSummary(models, clientId) {
  const { Invoice, Payment } = models;

  const [totalBilled, totalCollected, lastPayment, openInvoices, advanceBalance] = await Promise.all([
    Invoice.sum("totalPaise", { where: { clientId, status: { [Op.ne]: "void" } } }),
    Payment.sum("amountPaise", { where: { clientId, status: "confirmed" } }),
    Payment.findOne({ where: { clientId, status: "confirmed" }, order: [["paymentDate", "DESC"]] }),
    Invoice.findAll({
      where: { clientId, status: { [Op.notIn]: ["void", "draft"] } },
      attributes: ["id", "totalPaise", "amountPaidPaise", "dueDate", "status"],
      raw: true,
    }),
    getClientAdvanceBalance(models, clientId),
  ]);

  const today = todayISO();
  let totalOutstanding = 0;
  let totalOverdue = 0;
  openInvoices.forEach((inv) => {
    const balance = inv.totalPaise - inv.amountPaidPaise;
    if (balance > 0) {
      totalOutstanding += balance;
      if (inv.dueDate < today) totalOverdue += balance;
    }
  });

  return {
    totalBilled: totalBilled || 0,
    totalCollected: totalCollected || 0,
    totalOutstanding,
    totalOverdue,
    advanceBalance,
    netReceivable: Math.max(totalOutstanding - advanceBalance, 0),
    lastPaymentDate: lastPayment?.paymentDate || null,
  };
}

// ── Bulk per-client stats (client payments table — no N+1) ─────────────

// Three grouped aggregate queries total, regardless of how many clients are
// on the current page — not one (or several) queries per client.
// dateFrom/dateTo (optional, YYYY-MM-DD) scope only the period figures —
// totalBilled by invoiceDate and totalCollected by paymentDate. Outstanding,
// overdue, and advance stay as-of-today running balances regardless.
export async function getBulkClientFinancialStats(models, clientIds, { dateFrom, dateTo } = {}) {
  const sequelize = models.Invoice.sequelize;
  const statsByClient = {};
  clientIds.forEach((id) => {
    statsByClient[id] = { totalBilled: 0, totalCollected: 0, totalOutstanding: 0, totalOverdue: 0, advanceBalance: 0, lastPaymentDate: null };
  });
  if (clientIds.length === 0) return statsByClient;

  const period = { dateFrom: dateFrom || null, dateTo: dateTo || null };
  const inPeriod = (column) =>
    `(CAST(:dateFrom AS DATE) IS NULL OR ${column} >= CAST(:dateFrom AS DATE)) AND (CAST(:dateTo AS DATE) IS NULL OR ${column} <= CAST(:dateTo AS DATE))`;

  const invoiceRows = await sequelize.query(
    `SELECT "clientId",
            COALESCE(SUM(CASE WHEN ${inPeriod('"invoiceDate"')} THEN "totalPaise" ELSE 0 END), 0) AS "totalBilled",
            COALESCE(SUM(CASE WHEN status != 'draft' THEN GREATEST("totalPaise" - "amountPaidPaise", 0) ELSE 0 END), 0) AS "totalOutstanding",
            COALESCE(SUM(CASE WHEN status NOT IN ('draft') AND "dueDate" < CURRENT_DATE AND "totalPaise" > "amountPaidPaise" THEN ("totalPaise" - "amountPaidPaise") ELSE 0 END), 0) AS "totalOverdue"
     FROM invoices
     WHERE "clientId" IN (:clientIds) AND status != 'void'
     GROUP BY "clientId"`,
    { replacements: { clientIds, ...period }, type: QueryTypes.SELECT }
  );

  const paymentRows = await sequelize.query(
    `SELECT "clientId",
            COALESCE(SUM(CASE WHEN ${inPeriod('"paymentDate"')} THEN "amountPaise" ELSE 0 END), 0) AS "totalCollected",
            MAX("paymentDate") AS "lastPaymentDate"
     FROM payments
     WHERE "clientId" IN (:clientIds) AND status = 'confirmed'
     GROUP BY "clientId"`,
    { replacements: { clientIds, ...period }, type: QueryTypes.SELECT }
  );

  const advanceRows = await sequelize.query(
    `SELECT p."clientId", COALESCE(SUM(pa."amountPaise"), 0) AS "unallocated"
     FROM payment_allocations pa
     JOIN payments p ON p.id = pa."paymentId"
     WHERE pa."invoiceId" IS NULL AND p."clientId" IN (:clientIds) AND p.status = 'confirmed'
     GROUP BY p."clientId"`,
    { replacements: { clientIds }, type: QueryTypes.SELECT }
  );

  const refundRows = await sequelize.query(
    `SELECT "clientId", COALESCE(SUM("amountPaise"), 0) AS "refunded"
     FROM refunds
     WHERE "clientId" IN (:clientIds)
     GROUP BY "clientId"`,
    { replacements: { clientIds }, type: QueryTypes.SELECT }
  );

  invoiceRows.forEach((r) => {
    statsByClient[r.clientId].totalBilled = parseInt(r.totalBilled, 10);
    statsByClient[r.clientId].totalOutstanding = parseInt(r.totalOutstanding, 10);
    statsByClient[r.clientId].totalOverdue = parseInt(r.totalOverdue, 10);
  });
  paymentRows.forEach((r) => {
    statsByClient[r.clientId].totalCollected = parseInt(r.totalCollected, 10);
    statsByClient[r.clientId].lastPaymentDate = r.lastPaymentDate;
  });
  const refundedByClient = {};
  refundRows.forEach((r) => {
    refundedByClient[r.clientId] = parseInt(r.refunded, 10);
  });
  advanceRows.forEach((r) => {
    const unallocated = parseInt(r.unallocated, 10);
    const refunded = refundedByClient[r.clientId] || 0;
    statsByClient[r.clientId].advanceBalance = Math.max(unallocated - refunded, 0);
  });

  return statsByClient;
}

// ── Dashboard overview (7 KPI cards) ────────────────────────────────────

export async function getOverviewTotals(models, { dateFrom, dateTo } = {}) {
  const { Invoice, Payment } = models;
  const invoiceDateWhere = { status: { [Op.ne]: "void" } };
  const paymentDateWhere = { status: "confirmed" };
  if (dateFrom || dateTo) {
    invoiceDateWhere.invoiceDate = {};
    paymentDateWhere.paymentDate = {};
    if (dateFrom) {
      invoiceDateWhere.invoiceDate[Op.gte] = dateFrom;
      paymentDateWhere.paymentDate[Op.gte] = dateFrom;
    }
    if (dateTo) {
      invoiceDateWhere.invoiceDate[Op.lte] = dateTo;
      paymentDateWhere.paymentDate[Op.lte] = dateTo;
    }
  }

  const [totalBilled, totalCollected, totalClients] = await Promise.all([
    Invoice.sum("totalPaise", { where: invoiceDateWhere }),
    Payment.sum("amountPaise", { where: paymentDateWhere }),
    models.Client.count(),
  ]);

  // Outstanding/overdue/advance are running balances as-of-now, not
  // period-bound the same way billed/collected are (an unpaid invoice from
  // last month is still outstanding today regardless of the selected range).
  const openInvoices = await Invoice.findAll({
    where: { status: { [Op.notIn]: ["void", "draft"] } },
    attributes: ["totalPaise", "amountPaidPaise", "dueDate"],
    raw: true,
  });
  const today = todayISO();
  let totalOutstanding = 0;
  let overdueAmount = 0;
  openInvoices.forEach((inv) => {
    const balance = inv.totalPaise - inv.amountPaidPaise;
    if (balance > 0) {
      totalOutstanding += balance;
      if (inv.dueDate < today) overdueAmount += balance;
    }
  });

  const advanceRow = await models.Invoice.sequelize.query(
    `SELECT COALESCE(SUM(pa."amountPaise"), 0) AS "unallocated"
     FROM payment_allocations pa
     JOIN payments p ON p.id = pa."paymentId"
     WHERE pa."invoiceId" IS NULL AND p.status = 'confirmed'`,
    { type: QueryTypes.SELECT }
  );
  const totalRefunded = await models.Refund.sum("amountPaise");
  const advanceBalance = Math.max(parseInt(advanceRow[0]?.unallocated || 0, 10) - (totalRefunded || 0), 0);

  return {
    totalClients,
    totalBilled: totalBilled || 0,
    totalCollected: totalCollected || 0,
    totalOutstanding,
    overdueAmount,
    advanceBalance,
    netReceivable: Math.max(totalOutstanding - advanceBalance, 0),
  };
}
