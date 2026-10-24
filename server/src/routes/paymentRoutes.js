import express from "express";
import multer from "multer";
import { Op, QueryTypes } from "sequelize";
import * as XLSX from "xlsx";
import { requireAdmin } from "../middleware/auth.js";
import { uploadFileToDrive, getOrCreateClientFolder, getOrCreateClientSubfolder } from "../utils/googleDrive.js";
import { wrapUpload } from "../middleware/multerUpload.js";
import { invalidateCache } from "../utils/serverCache.js";
import { generateInvoiceNumber } from "../utils/invoiceNumbering.js";
import {
  computeInvoiceTotals,
  recomputeInvoiceFromAllocations,
  withOverdueOverlay,
  syncOverdueInvoices,
  getClientAdvanceBalance,
  getClientFinancialSummary,
  getBulkClientFinancialStats,
  getOverviewTotals,
} from "../utils/paymentCalculations.js";

const router = express.Router();

// Same admin-only gate every other financial/document feature in this app
// already uses (Invoices, Agreements, Proposals, Salary Slips) — this app
// has no finer-grained permission system to hook into (confirmed).
router.use(requireAdmin);

const todayISO = () => new Date().toISOString().slice(0, 10);

async function logActivity(models, { clientId, invoiceId = null, paymentId = null, action, user, amountPaise = null, metadata }) {
  try {
    await models.PaymentActivityLog.create({
      clientId,
      invoiceId,
      paymentId,
      action,
      userName: user?.name || null,
      amountPaise,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.warn("Could not record payment activity:", err.message);
  }
}

const serializeInvoice = (invoice) => withOverdueOverlay(invoice.toJSON ? invoice.toJSON() : invoice);

// Primary status + secondary flags for one client row — presentation
// labels only; every figure behind them comes from paymentCalculations.js.
function computeClientStatus(stats, { hasBillingConfig, hasInvoices }) {
  if (!hasBillingConfig && !hasInvoices) return { primary: "No Billing Configured", hasOverdue: false, hasAdvance: stats.advanceBalance > 0 };
  const hasOverdue = stats.totalOverdue > 0;
  const hasAdvance = stats.advanceBalance > 0;
  let primary;
  if (hasOverdue) primary = "Overdue";
  else if (stats.totalOutstanding === 0 && stats.totalBilled > 0) primary = "Paid";
  else if (stats.totalOutstanding > 0 && stats.totalOutstanding < stats.totalBilled) primary = "Partially Paid";
  else if (stats.totalOutstanding > 0) primary = "Unpaid";
  else primary = "No Billing Configured";
  return { primary, hasOverdue, hasAdvance };
}

// ── Overview (dashboard KPI cards) ──────────────────────────────────────

router.get("/payments/overview", async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const totals = await getOverviewTotals(req.app.locals.models, { dateFrom, dateTo });
    res.json({ success: true, data: totals });
  } catch (error) {
    console.error("Error fetching payments overview:", error);
    res.status(500).json({ success: false, message: "Error fetching payments overview", error: error.message });
  }
});

// ── Client payments table ───────────────────────────────────────────────

router.get("/payments/clients", async (req, res) => {
  try {
    const { Client, ClientBillingConfig, ClientBillingPlanItem, Invoice } = req.app.locals.models;
    const { search, service, frequency, status, sortBy = "name", sortDir = "ASC", page = 1, limit = 24 } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { legalName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include = [{ model: ClientBillingConfig, as: "billingConfig", include: [{ model: ClientBillingPlanItem, as: "planItems" }] }];
    if (service) include[0].include[0].where = { serviceName: { [Op.iLike]: `%${service}%` } };
    if (frequency) include[0].where = { ...(include[0].where || {}), billingFrequency: frequency };

    // Candidate set after search/service/frequency filters — status is a
    // computed label, so it's applied (and the final page cut) in memory
    // after bulk-fetching figures for this candidate set, not per-client.
    const candidates = await Client.findAll({ where, include, order: [["name", "ASC"]] });
    const clientIds = candidates.map((c) => c.id);

    const [stats, invoiceCounts] = await Promise.all([
      getBulkClientFinancialStats(req.app.locals.models, clientIds),
      clientIds.length
        ? Invoice.findAll({ where: { clientId: { [Op.in]: clientIds } }, attributes: ["clientId"], group: ["clientId"], raw: true })
        : [],
    ]);
    const clientsWithInvoices = new Set(invoiceCounts.map((r) => r.clientId));

    let rows = candidates.map((client) => {
      const json = client.toJSON();
      const clientStats = stats[client.id] || { totalBilled: 0, totalCollected: 0, totalOutstanding: 0, totalOverdue: 0, advanceBalance: 0, lastPaymentDate: null };
      const statusInfo = computeClientStatus(clientStats, {
        hasBillingConfig: Boolean(json.billingConfig),
        hasInvoices: clientsWithInvoices.has(client.id),
      });
      return {
        id: json.id,
        name: json.name,
        legalName: json.legalName,
        contactPersonName: json.contactPersonName,
        email: json.email,
        phoneNumber: json.phoneNumber,
        billingConfig: json.billingConfig,
        ...clientStats,
        status: statusInfo,
      };
    });

    if (status) {
      rows = rows.filter((r) => r.status.primary.toLowerCase().replace(/\s+/g, "_") === status.toLowerCase().replace(/\s+/g, "_"));
    }

    const sortKey = ["name", "totalBilled", "totalOutstanding", "totalOverdue", "advanceBalance", "lastPaymentDate"].includes(sortBy) ? sortBy : "name";
    rows.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "DESC" ? -cmp : cmp;
    });

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page) || 1;
    const total = rows.length;
    const paged = rows.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

    res.json({
      success: true,
      data: paged,
      pagination: { total, page: parsedPage, limit: parsedLimit, totalPages: Math.max(Math.ceil(total / parsedLimit), 1) },
    });
  } catch (error) {
    console.error("Error fetching client payments table:", error);
    res.status(500).json({ success: false, message: "Error fetching client payments table", error: error.message });
  }
});

router.get("/payments/clients/:clientId", async (req, res) => {
  try {
    const models = req.app.locals.models;
    const { Client, ClientBillingConfig, ClientBillingPlanItem, Invoice, InvoiceLineItem, Payment, PaymentReminder } = models;
    const clientId = parseInt(req.params.clientId);

    const client = await Client.findByPk(clientId, {
      include: [{ model: ClientBillingConfig, as: "billingConfig", include: [{ model: ClientBillingPlanItem, as: "planItems" }] }],
    });
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });

    const [summary, invoices, payments, reminders] = await Promise.all([
      getClientFinancialSummary(models, clientId),
      // lineItems included so the Invoices tab's inline "Edit" (draft-only)
      // can prefill the real stored rows instead of a blank editor. `order`
      // nested inside an include doesn't reliably sort a hasMany — the
      // association-qualified top-level form is what actually sorts
      // lineItems (same fix already verified for Agreement/Proposal exports).
      Invoice.findAll({
        where: { clientId },
        include: [{ model: InvoiceLineItem, as: "lineItems" }],
        order: [["invoiceDate", "DESC"], [{ model: InvoiceLineItem, as: "lineItems" }, "sortOrder", "ASC"]],
        limit: 50,
      }),
      Payment.findAll({ where: { clientId }, order: [["paymentDate", "DESC"]], limit: 50 }),
      PaymentReminder.findAll({ where: { clientId, status: "pending" }, order: [["createdAt", "DESC"]] }),
    ]);

    res.json({
      success: true,
      data: {
        client: client.toJSON(),
        summary,
        invoices: invoices.map(serializeInvoice),
        payments: payments.map((p) => p.toJSON()),
        reminders: reminders.map((r) => r.toJSON()),
      },
    });
  } catch (error) {
    console.error("Error fetching client payment detail:", error);
    res.status(500).json({ success: false, message: "Error fetching client payment detail", error: error.message });
  }
});

// ── Billing configuration ───────────────────────────────────────────────

router.get("/billing-config/:clientId", async (req, res) => {
  try {
    const { ClientBillingConfig, ClientBillingPlanItem } = req.app.locals.models;
    const config = await ClientBillingConfig.findOne({
      where: { clientId: req.params.clientId },
      include: [{ model: ClientBillingPlanItem, as: "planItems", order: [["sortOrder", "ASC"]] }],
    });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching billing configuration", error: error.message });
  }
});

router.post("/billing-config/:clientId", async (req, res) => {
  try {
    const { ClientBillingConfig, ClientBillingPlanItem, Client } = req.app.locals.models;
    const clientId = parseInt(req.params.clientId);
    const clientRecord = await Client.findByPk(clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    const existing = await ClientBillingConfig.findOne({ where: { clientId } });
    if (existing) return res.status(409).json({ success: false, message: "This client already has a billing configuration — use PUT to update it" });

    const { billingFrequency, billingStartDate, billingDay, dueInDays, taxRateBasisPoints, status, notes, planItems = [] } = req.body;

    const sequelize = ClientBillingConfig.sequelize;
    const config = await sequelize.transaction(async (transaction) => {
      const created = await ClientBillingConfig.create(
        {
          clientId,
          billingFrequency: billingFrequency || "monthly",
          billingStartDate: billingStartDate || null,
          billingDay: billingDay || null,
          dueInDays: dueInDays ?? 15,
          taxRateBasisPoints: taxRateBasisPoints ?? 0,
          status: status || "active",
          notes: notes || null,
          createdBy: req.user?.name || null,
          updatedBy: req.user?.name || null,
        },
        { transaction }
      );
      for (const [index, item] of planItems.entries()) {
        await ClientBillingPlanItem.create(
          {
            billingConfigId: created.id,
            serviceName: item.serviceName,
            description: item.description || null,
            amountPaise: item.amountPaise,
            isOneTime: Boolean(item.isOneTime),
            sortOrder: index,
          },
          { transaction }
        );
      }
      return created;
    });

    await logActivity(req.app.locals.models, { clientId, action: "billing_config_created", user: req.user });
    res.status(201).json({ success: true, message: "Billing configuration created", data: config });
  } catch (error) {
    console.error("Error creating billing configuration:", error);
    res.status(500).json({ success: false, message: "Error creating billing configuration", error: error.message });
  }
});

router.put("/billing-config/:clientId", async (req, res) => {
  try {
    const { ClientBillingConfig, ClientBillingPlanItem } = req.app.locals.models;
    const clientId = parseInt(req.params.clientId);
    const config = await ClientBillingConfig.findOne({ where: { clientId } });
    if (!config) return res.status(404).json({ success: false, message: "No billing configuration found for this client" });

    const { billingFrequency, billingStartDate, billingDay, dueInDays, taxRateBasisPoints, status, notes, planItems } = req.body;

    const sequelize = ClientBillingConfig.sequelize;
    await sequelize.transaction(async (transaction) => {
      await config.update(
        {
          billingFrequency: billingFrequency ?? config.billingFrequency,
          billingStartDate: billingStartDate !== undefined ? billingStartDate : config.billingStartDate,
          billingDay: billingDay !== undefined ? billingDay : config.billingDay,
          dueInDays: dueInDays ?? config.dueInDays,
          taxRateBasisPoints: taxRateBasisPoints ?? config.taxRateBasisPoints,
          status: status ?? config.status,
          notes: notes !== undefined ? notes : config.notes,
          updatedBy: req.user?.name || config.updatedBy,
        },
        { transaction }
      );
      // Historical invoices keep their own frozen InvoiceLineItem rows, so
      // replacing plan items here never touches anything already issued.
      if (Array.isArray(planItems)) {
        await ClientBillingPlanItem.destroy({ where: { billingConfigId: config.id }, transaction });
        for (const [index, item] of planItems.entries()) {
          await ClientBillingPlanItem.create(
            {
              billingConfigId: config.id,
              serviceName: item.serviceName,
              description: item.description || null,
              amountPaise: item.amountPaise,
              isOneTime: Boolean(item.isOneTime),
              sortOrder: index,
            },
            { transaction }
          );
        }
      }
    });

    await logActivity(req.app.locals.models, { clientId, action: "billing_config_updated", user: req.user });
    const refreshed = await ClientBillingConfig.findByPk(config.id, { include: [{ model: ClientBillingPlanItem, as: "planItems" }] });
    res.json({ success: true, message: "Billing configuration updated", data: refreshed });
  } catch (error) {
    console.error("Error updating billing configuration:", error);
    res.status(500).json({ success: false, message: "Error updating billing configuration", error: error.message });
  }
});

// ── Invoices ─────────────────────────────────────────────────────────────

router.get("/invoices", async (req, res) => {
  try {
    const { Invoice, Client } = req.app.locals.models;
    const { clientId, status, search, page = 1, limit = 24 } = req.query;
    await syncOverdueInvoices(req.app.locals.models);

    const where = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;
    if (search) where.invoiceNumber = { [Op.iLike]: `%${search}%` };

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page) || 1;
    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [{ model: Client, as: "client", attributes: ["id", "name"] }],
      order: [["invoiceDate", "DESC"]],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });

    res.json({
      success: true,
      data: rows.map(serializeInvoice),
      pagination: { total: count, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(count / parsedLimit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching invoices", error: error.message });
  }
});

router.get("/invoices/outstanding", async (req, res) => {
  try {
    const { Invoice, Client, PaymentReminder } = req.app.locals.models;
    await syncOverdueInvoices(req.app.locals.models);
    const { overdueRange, clientId, page = 1, limit = 24 } = req.query;

    const where = { status: { [Op.in]: ["issued", "partially_paid", "overdue"] } };
    if (clientId) where.clientId = parseInt(clientId);

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page) || 1;
    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Client, as: "client", attributes: ["id", "name"] },
        { model: PaymentReminder, as: "reminders", order: [["createdAt", "DESC"]], limit: 1, separate: true },
      ],
      order: [["dueDate", "ASC"]],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });

    const today = todayISO();
    let data = rows.map((inv) => {
      const json = serializeInvoice(inv);
      const balance = json.totalPaise - json.amountPaidPaise;
      const daysOverdue = Math.max(Math.floor((new Date(today) - new Date(json.dueDate)) / (1000 * 60 * 60 * 24)), 0);
      return { ...json, remainingPaise: balance, daysOverdue, lastFollowUp: json.reminders?.[0] || null };
    });
    data = data.filter((inv) => inv.remainingPaise > 0);

    if (overdueRange) {
      const ranges = { "1-7": [1, 7], "8-15": [8, 15], "16-30": [16, 30], "30+": [31, Infinity] };
      const [min, max] = ranges[overdueRange] || [0, Infinity];
      data = data.filter((inv) => inv.daysOverdue >= min && inv.daysOverdue <= max);
    }

    res.json({ success: true, data, pagination: { total: count, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(count / parsedLimit) || 1 } });
  } catch (error) {
    console.error("Error fetching outstanding invoices:", error);
    res.status(500).json({ success: false, message: "Error fetching outstanding invoices", error: error.message });
  }
});

// A non-transactional peek at the next sequential invoice number, for a
// caller (the Invoice Builder) that wants to show a real, properly-
// formatted number before the invoice itself actually exists yet. It's a
// suggestion, not a reservation — POST /invoices still assigns the
// authoritative number transactionally at creation time, and gracefully
// handles the rare case where this peeked number was taken in the meantime.
// Must stay registered above GET /invoices/:id, or Express matches
// "next-number" as an :id.
router.get("/invoices/next-number", async (req, res) => {
  try {
    const { Invoice } = req.app.locals.models;
    const invoiceNumber = await generateInvoiceNumber(Invoice, null);
    res.json({ success: true, data: { invoiceNumber } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error generating invoice number", error: error.message });
  }
});

router.get("/invoices/:id", async (req, res) => {
  try {
    const { Invoice, Client, InvoiceLineItem } = req.app.locals.models;
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: "client" },
        { model: InvoiceLineItem, as: "lineItems", order: [["sortOrder", "ASC"]] },
      ],
    });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: serializeInvoice(invoice) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching invoice", error: error.message });
  }
});

// Creates an invoice — manual (clientId + lineItems supplied directly) or
// seeded from the client's billing config when billingConfigId is given and
// lineItems is omitted. Starts as "draft" unless issueImmediately is set.
router.post("/invoices", async (req, res) => {
  try {
    const { Invoice, InvoiceLineItem, Client, ClientBillingConfig, ClientBillingPlanItem } = req.app.locals.models;
    const { clientId, billingConfigId, invoiceDate, dueDate, billingPeriodStart, billingPeriodEnd, discountPaise, taxRateBasisPoints, notes, termsText, issueImmediately } = req.body;
    let { lineItems, invoiceNumber: requestedInvoiceNumber } = req.body;

    if (!clientId) return res.status(400).json({ success: false, message: "clientId is required" });
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    let resolvedTaxRate = taxRateBasisPoints;
    let resolvedDueDate = dueDate;
    if (billingConfigId) {
      const config = await ClientBillingConfig.findByPk(parseInt(billingConfigId), { include: [{ model: ClientBillingPlanItem, as: "planItems" }] });
      if (!config) return res.status(404).json({ success: false, message: "Billing configuration not found" });
      if (!lineItems || lineItems.length === 0) {
        lineItems = config.planItems.map((item) => ({ description: item.serviceName, quantity: 1, unitPricePaise: item.amountPaise }));
      }
      if (resolvedTaxRate === undefined) resolvedTaxRate = config.taxRateBasisPoints;
      if (!resolvedDueDate) {
        const base = new Date(invoiceDate || todayISO());
        base.setDate(base.getDate() + (config.dueInDays || 15));
        resolvedDueDate = base.toISOString().slice(0, 10);
      }
    }

    if (!lineItems || lineItems.length === 0) return res.status(400).json({ success: false, message: "At least one line item is required" });
    if (!resolvedDueDate) return res.status(400).json({ success: false, message: "dueDate is required" });

    const totals = computeInvoiceTotals({ lineItems, discountPaise: discountPaise || 0, taxRateBasisPoints: resolvedTaxRate || 0 });

    requestedInvoiceNumber = typeof requestedInvoiceNumber === "string" ? requestedInvoiceNumber.trim() : "";

    const sequelize = Invoice.sequelize;
    let invoice;
    try {
      invoice = await sequelize.transaction(async (transaction) => {
        // A caller (the Invoice Builder) that already displays its own
        // number — likely the one this route itself suggested via
        // GET /invoices/next-number — gets to keep it, so the PDF and the
        // ledger agree on the same number. Anything else gets a freshly
        // generated one, same as before.
        const invoiceNumber = requestedInvoiceNumber || (await generateInvoiceNumber(Invoice, transaction));
        const created = await Invoice.create(
          {
            clientId: clientRecord.id,
            billingConfigId: billingConfigId ? parseInt(billingConfigId) : null,
            invoiceNumber,
            status: issueImmediately ? "issued" : "draft",
            invoiceDate: invoiceDate || todayISO(),
            dueDate: resolvedDueDate,
            billingPeriodStart: billingPeriodStart || null,
            billingPeriodEnd: billingPeriodEnd || null,
            ...totals,
            notes: notes || null,
            termsText: termsText || null,
            createdBy: req.user?.name || null,
            updatedBy: req.user?.name || null,
          },
          { transaction }
        );
        for (const [index, item] of lineItems.entries()) {
          await InvoiceLineItem.create(
            {
              invoiceId: created.id,
              description: item.description,
              quantity: item.quantity,
              unitPricePaise: item.unitPricePaise,
              lineTotalPaise: item.quantity * item.unitPricePaise,
              sortOrder: index,
            },
            { transaction }
          );
        }
        return created;
      });
    } catch (txError) {
      if (requestedInvoiceNumber && (txError.name === "SequelizeUniqueConstraintError" || /invoiceNumber/i.test(txError.message))) {
        return res.status(409).json({ success: false, message: `An invoice numbered "${requestedInvoiceNumber}" already exists — change the number and try again.` });
      }
      throw txError;
    }

    await logActivity(req.app.locals.models, { clientId: clientRecord.id, invoiceId: invoice.id, action: "invoice_created", user: req.user, amountPaise: invoice.totalPaise });
    await invalidateCache("payments");
    res.status(201).json({ success: true, message: "Invoice created", data: serializeInvoice(invoice) });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ success: false, message: "Error creating invoice", error: error.message });
  }
});

router.put("/invoices/:id", async (req, res) => {
  try {
    const { Invoice, InvoiceLineItem } = req.app.locals.models;
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    // Editable any time nothing has actually been paid against it yet
    // (draft, issued, or overdue-but-unpaid) — once a payment or advance
    // has touched it, the figures are locked (void + duplicate is the
    // correction path). This is deliberately looser than "draft only": an
    // issued-but-unpaid invoice is still just as safe to correct.
    if (invoice.status === "void" || invoice.amountPaidPaise > 0) {
      return res.status(400).json({ success: false, message: "This invoice has payments applied to it — void and duplicate it to correct it instead." });
    }

    const { expectedRevision, lineItems, discountPaise, taxRateBasisPoints, invoiceDate, dueDate, notes, termsText } = req.body;
    if (expectedRevision !== undefined && parseInt(expectedRevision) !== invoice.revision) {
      return res.status(409).json({ success: false, message: "This invoice was changed elsewhere since you opened it.", data: serializeInvoice(invoice) });
    }

    const sequelize = Invoice.sequelize;
    await sequelize.transaction(async (transaction) => {
      let totals = { subtotalPaise: invoice.subtotalPaise, discountPaise: invoice.discountPaise, taxPaise: invoice.taxPaise, totalPaise: invoice.totalPaise };
      if (Array.isArray(lineItems)) {
        await InvoiceLineItem.destroy({ where: { invoiceId: invoice.id }, transaction });
        for (const [index, item] of lineItems.entries()) {
          await InvoiceLineItem.create(
            { invoiceId: invoice.id, description: item.description, quantity: item.quantity, unitPricePaise: item.unitPricePaise, lineTotalPaise: item.quantity * item.unitPricePaise, sortOrder: index },
            { transaction }
          );
        }
        // Falls back to the invoice's own current effective rate (derived
        // from its stored tax/subtotal) when the caller changes line items
        // without explicitly re-stating a rate — not just 0, which would
        // silently zero out tax on an otherwise ordinary line-item edit.
        const existingTaxableAmount = Math.max(invoice.subtotalPaise - invoice.discountPaise, 1);
        const fallbackTaxRateBasisPoints = Math.round((invoice.taxPaise / existingTaxableAmount) * 10000);
        totals = computeInvoiceTotals({
          lineItems,
          discountPaise: discountPaise !== undefined ? discountPaise : invoice.discountPaise,
          taxRateBasisPoints: taxRateBasisPoints !== undefined ? taxRateBasisPoints : fallbackTaxRateBasisPoints,
        });
      }
      await invoice.update(
        {
          ...totals,
          invoiceDate: invoiceDate ?? invoice.invoiceDate,
          dueDate: dueDate ?? invoice.dueDate,
          notes: notes !== undefined ? notes : invoice.notes,
          termsText: termsText !== undefined ? termsText : invoice.termsText,
          revision: invoice.revision + 1,
          updatedBy: req.user?.name || invoice.updatedBy,
        },
        { transaction }
      );
    });

    await logActivity(req.app.locals.models, { clientId: invoice.clientId, invoiceId: invoice.id, action: "invoice_edited", user: req.user });
    await invalidateCache("payments");
    res.json({ success: true, message: "Invoice saved", data: serializeInvoice(invoice) });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ success: false, message: "Error updating invoice", error: error.message });
  }
});

router.post("/invoices/:id/issue", async (req, res) => {
  try {
    const { Invoice } = req.app.locals.models;
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (invoice.status !== "draft") return res.status(400).json({ success: false, message: "Only a draft invoice can be issued" });

    await invoice.update({ status: "issued", updatedBy: req.user?.name || invoice.updatedBy });
    await logActivity(req.app.locals.models, { clientId: invoice.clientId, invoiceId: invoice.id, action: "invoice_issued", user: req.user, amountPaise: invoice.totalPaise });
    await invalidateCache("payments");
    res.json({ success: true, message: "Invoice issued", data: serializeInvoice(invoice) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error issuing invoice", error: error.message });
  }
});

router.post("/invoices/:id/void", async (req, res) => {
  try {
    const { Invoice } = req.app.locals.models;
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (invoice.status === "void") return res.status(400).json({ success: false, message: "Invoice is already void" });
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ success: false, message: "A reason is required to void an invoice" });

    await invoice.update({ status: "void", voidReason: reason.trim(), voidedAt: new Date(), updatedBy: req.user?.name || invoice.updatedBy });
    await logActivity(req.app.locals.models, { clientId: invoice.clientId, invoiceId: invoice.id, action: "invoice_voided", user: req.user, metadata: { reason: reason.trim() } });
    await invalidateCache("payments");
    res.json({ success: true, message: "Invoice voided", data: serializeInvoice(invoice) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error voiding invoice", error: error.message });
  }
});

router.post("/invoices/:id/duplicate", async (req, res) => {
  try {
    const { Invoice, InvoiceLineItem } = req.app.locals.models;
    const source = await Invoice.findByPk(req.params.id, { include: [{ model: InvoiceLineItem, as: "lineItems" }] });
    if (!source) return res.status(404).json({ success: false, message: "Invoice not found" });

    const sequelize = Invoice.sequelize;
    const duplicate = await sequelize.transaction(async (transaction) => {
      const invoiceNumber = await generateInvoiceNumber(Invoice, transaction);
      const created = await Invoice.create(
        {
          clientId: source.clientId,
          billingConfigId: source.billingConfigId,
          invoiceNumber,
          status: "draft",
          invoiceDate: todayISO(),
          dueDate: source.dueDate,
          subtotalPaise: source.subtotalPaise,
          discountPaise: source.discountPaise,
          taxPaise: source.taxPaise,
          totalPaise: source.totalPaise,
          notes: source.notes,
          termsText: source.termsText,
          createdBy: req.user?.name || null,
          updatedBy: req.user?.name || null,
        },
        { transaction }
      );
      for (const item of source.lineItems) {
        await InvoiceLineItem.create(
          { invoiceId: created.id, description: item.description, quantity: item.quantity, unitPricePaise: item.unitPricePaise, lineTotalPaise: item.lineTotalPaise, sortOrder: item.sortOrder },
          { transaction }
        );
      }
      return created;
    });

    await logActivity(req.app.locals.models, { clientId: source.clientId, invoiceId: duplicate.id, action: "invoice_created", user: req.user, metadata: { duplicatedFrom: source.id } });
    await invalidateCache("payments");
    res.status(201).json({ success: true, message: "Invoice duplicated as a new draft", data: serializeInvoice(duplicate) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error duplicating invoice", error: error.message });
  }
});

// ── Recurring billing (manual preview → confirm, no cron this pass) ────

async function resolveRecurringCandidates(models, { asOf } = {}) {
  const { ClientBillingConfig, ClientBillingPlanItem, Invoice, Client } = models;
  const refDate = asOf ? new Date(asOf) : new Date();
  const configs = await ClientBillingConfig.findAll({
    where: { status: "active", billingFrequency: { [Op.ne]: "one_time" } },
    include: [
      { model: ClientBillingPlanItem, as: "planItems" },
      { model: Client, as: "client", attributes: ["id", "name"] },
    ],
  });

  const monthsPerCycle = { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 };
  const candidates = [];
  for (const config of configs) {
    if (!config.billingStartDate || !config.planItems.length) continue;
    const start = new Date(config.billingStartDate);
    const step = monthsPerCycle[config.billingFrequency] || 1;

    // Walk forward from billingStartDate in whole cycles until we find the
    // current (or most recently due) period that has no invoice yet.
    let periodStart = new Date(start);
    let periodEnd;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + step);
      periodEnd.setDate(periodEnd.getDate() - 1);
      if (periodEnd >= refDate) break;
      periodStart = new Date(periodStart);
      periodStart.setMonth(periodStart.getMonth() + step);
    }
    if (periodStart > refDate) continue; // next cycle hasn't started yet

    const periodStartStr = periodStart.toISOString().slice(0, 10);
    const existing = await Invoice.findOne({ where: { billingConfigId: config.id, billingPeriodStart: periodStartStr } });
    if (existing) continue;

    const lineItems = config.planItems.map((item) => ({ description: item.serviceName, quantity: 1, unitPricePaise: item.amountPaise }));
    const totals = computeInvoiceTotals({ lineItems, discountPaise: 0, taxRateBasisPoints: config.taxRateBasisPoints });
    const dueDate = new Date(refDate);
    dueDate.setDate(dueDate.getDate() + (config.dueInDays || 15));

    candidates.push({
      billingConfigId: config.id,
      clientId: config.clientId,
      clientName: config.client?.name,
      billingPeriodStart: periodStartStr,
      billingPeriodEnd: periodEnd.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      lineItems,
      ...totals,
    });
  }
  return candidates;
}

router.post("/billing/recurring/preview", async (req, res) => {
  try {
    const candidates = await resolveRecurringCandidates(req.app.locals.models, req.body || {});
    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error("Error previewing recurring invoices:", error);
    res.status(500).json({ success: false, message: "Error previewing recurring invoices", error: error.message });
  }
});

router.post("/billing/recurring/generate", async (req, res) => {
  try {
    const models = req.app.locals.models;
    const { Invoice, InvoiceLineItem } = models;
    const candidates = await resolveRecurringCandidates(models, req.body || {});
    const sequelize = Invoice.sequelize;
    const created = [];

    for (const candidate of candidates) {
      try {
        const invoice = await sequelize.transaction(async (transaction) => {
          // Re-check inside the transaction — the duplicate-prevention
          // guard a concurrent/second click must actually honor.
          const existing = await Invoice.findOne({ where: { billingConfigId: candidate.billingConfigId, billingPeriodStart: candidate.billingPeriodStart }, transaction });
          if (existing) return null;
          const invoiceNumber = await generateInvoiceNumber(Invoice, transaction);
          const inv = await Invoice.create(
            {
              clientId: candidate.clientId,
              billingConfigId: candidate.billingConfigId,
              invoiceNumber,
              status: "issued",
              invoiceDate: todayISO(),
              dueDate: candidate.dueDate,
              billingPeriodStart: candidate.billingPeriodStart,
              billingPeriodEnd: candidate.billingPeriodEnd,
              subtotalPaise: candidate.subtotalPaise,
              discountPaise: candidate.discountPaise,
              taxPaise: candidate.taxPaise,
              totalPaise: candidate.totalPaise,
              createdBy: req.user?.name || null,
              updatedBy: req.user?.name || null,
            },
            { transaction }
          );
          for (const [index, item] of candidate.lineItems.entries()) {
            await InvoiceLineItem.create(
              { invoiceId: inv.id, description: item.description, quantity: item.quantity, unitPricePaise: item.unitPricePaise, lineTotalPaise: item.quantity * item.unitPricePaise, sortOrder: index },
              { transaction }
            );
          }
          return inv;
        });
        if (invoice) {
          created.push(invoice);
          await logActivity(models, { clientId: candidate.clientId, invoiceId: invoice.id, action: "invoice_created", user: req.user, amountPaise: invoice.totalPaise, metadata: { recurring: true } });
        }
      } catch (err) {
        console.warn("Skipped a recurring candidate due to an error:", err.message);
      }
    }

    await invalidateCache("payments");
    res.status(201).json({ success: true, message: `${created.length} invoice(s) generated`, data: created.map(serializeInvoice) });
  } catch (error) {
    console.error("Error generating recurring invoices:", error);
    res.status(500).json({ success: false, message: "Error generating recurring invoices", error: error.message });
  }
});

// ── Payments ─────────────────────────────────────────────────────────────

// Records a payment and splits it across requested invoice allocations +
// an automatic advance remainder. Every invoice touched is row-locked
// inside the transaction and re-checked against its CURRENT remaining
// balance — this (not a client-side guess) is what prevents overpayment
// through duplicate/concurrent allocation requests.
router.post("/payments", async (req, res) => {
  try {
    const models = req.app.locals.models;
    const { Payment, PaymentAllocation, Invoice } = models;
    const { clientId, paymentDate, amountPaise, method, referenceNumber, notes, internalReference, attachmentDocumentId, allocations = [] } = req.body;

    if (!clientId || !amountPaise || amountPaise <= 0) {
      return res.status(400).json({ success: false, message: "clientId and a positive amountPaise are required" });
    }
    const requestedTotal = allocations.reduce((sum, a) => sum + (a.amountPaise || 0), 0);
    if (requestedTotal > amountPaise) {
      return res.status(400).json({ success: false, message: "Requested allocations exceed the payment amount" });
    }

    const sequelize = Payment.sequelize;
    const result = await sequelize.transaction(async (transaction) => {
      const payment = await Payment.create(
        {
          clientId: parseInt(clientId),
          paymentDate: paymentDate || todayISO(),
          amountPaise,
          method: method || "other",
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          internalReference: internalReference || null,
          attachmentDocumentId: attachmentDocumentId || null,
          status: "confirmed",
          createdBy: req.user?.name || null,
        },
        { transaction }
      );

      const touchedInvoiceIds = new Set();
      for (const alloc of allocations) {
        if (!alloc.invoiceId || !alloc.amountPaise || alloc.amountPaise <= 0) continue;
        const invoice = await Invoice.findByPk(alloc.invoiceId, { transaction, lock: true });
        if (!invoice) throw Object.assign(new Error(`Invoice ${alloc.invoiceId} not found`), { statusCode: 404 });
        const remaining = invoice.totalPaise - invoice.amountPaidPaise;
        if (alloc.amountPaise > remaining) {
          throw Object.assign(new Error(`Allocation of ${alloc.amountPaise} exceeds invoice ${invoice.invoiceNumber}'s remaining balance of ${remaining}`), { statusCode: 400 });
        }
        await PaymentAllocation.create({ paymentId: payment.id, invoiceId: invoice.id, amountPaise: alloc.amountPaise, createdBy: req.user?.name || null }, { transaction });
        touchedInvoiceIds.add(invoice.id);
      }

      const remainder = amountPaise - requestedTotal;
      if (remainder > 0) {
        await PaymentAllocation.create({ paymentId: payment.id, invoiceId: null, amountPaise: remainder, createdBy: req.user?.name || null }, { transaction });
      }

      for (const invoiceId of touchedInvoiceIds) {
        await recomputeInvoiceFromAllocations(models, invoiceId, transaction);
      }

      return { payment, touchedInvoiceIds: Array.from(touchedInvoiceIds), remainder };
    });

    await logActivity(models, { clientId: parseInt(clientId), paymentId: result.payment.id, action: "payment_recorded", user: req.user, amountPaise, metadata: { allocatedToInvoices: result.touchedInvoiceIds, advanceRemainder: result.remainder } });
    await invalidateCache("payments");
    res.status(201).json({ success: true, message: "Payment recorded", data: result.payment });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode !== 400 && statusCode !== 404) console.error("Error recording payment:", error);
    res.status(statusCode).json({ success: false, message: error.message || "Error recording payment" });
  }
});

router.post("/payments/:id/reverse", async (req, res) => {
  try {
    const models = req.app.locals.models;
    const { Payment, PaymentAllocation } = models;
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.status === "reversed") return res.status(400).json({ success: false, message: "Payment is already reversed" });
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ success: false, message: "A reason is required to reverse a payment" });

    const sequelize = Payment.sequelize;
    const touchedInvoiceIds = await sequelize.transaction(async (transaction) => {
      const allocations = await PaymentAllocation.findAll({ where: { paymentId: payment.id }, transaction });
      const invoiceIds = allocations.map((a) => a.invoiceId).filter(Boolean);
      await payment.update({ status: "reversed", reversalReason: reason.trim(), reversedAt: new Date() }, { transaction });
      for (const invoiceId of invoiceIds) {
        await recomputeInvoiceFromAllocations(models, invoiceId, transaction);
      }
      return invoiceIds;
    });

    await logActivity(models, { clientId: payment.clientId, paymentId: payment.id, action: "payment_reversed", user: req.user, amountPaise: payment.amountPaise, metadata: { reason: reason.trim(), affectedInvoices: touchedInvoiceIds } });
    await invalidateCache("payments");
    res.json({ success: true, message: "Payment reversed", data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error reversing payment", error: error.message });
  }
});

// ── Advance application ──────────────────────────────────────────────────

// Moves existing unallocated allocation rows (FIFO, oldest payment first)
// onto an invoice — splitting a row when only part of it is needed. Never
// creates a new Payment, so this can never look like fresh cash collected.
router.post("/advances/apply", async (req, res) => {
  try {
    const models = req.app.locals.models;
    const { PaymentAllocation, Payment, Invoice } = models;
    const { clientId, invoiceId, amountPaise } = req.body;
    if (!clientId || !invoiceId || !amountPaise || amountPaise <= 0) {
      return res.status(400).json({ success: false, message: "clientId, invoiceId, and a positive amountPaise are required" });
    }

    const sequelize = Invoice.sequelize;
    await sequelize.transaction(async (transaction) => {
      const invoice = await Invoice.findByPk(invoiceId, { transaction, lock: true });
      if (!invoice) throw Object.assign(new Error("Invoice not found"), { statusCode: 404 });
      const remaining = invoice.totalPaise - invoice.amountPaidPaise;
      if (amountPaise > remaining) {
        throw Object.assign(new Error(`Requested advance application of ${amountPaise} exceeds the invoice's remaining balance of ${remaining}`), { statusCode: 400 });
      }

      const sourceRows = await PaymentAllocation.findAll({
        where: { invoiceId: null },
        include: [{ model: Payment, as: "payment", where: { clientId: parseInt(clientId), status: "confirmed" }, required: true }],
        order: [["createdAt", "ASC"]],
        transaction,
        lock: true,
      });
      const available = sourceRows.reduce((sum, r) => sum + r.amountPaise, 0);
      if (amountPaise > available) {
        throw Object.assign(new Error(`This client only has ${available} paise of available advance`), { statusCode: 400 });
      }

      let remainingToApply = amountPaise;
      for (const row of sourceRows) {
        if (remainingToApply <= 0) break;
        if (row.amountPaise <= remainingToApply) {
          await row.update({ invoiceId }, { transaction });
          remainingToApply -= row.amountPaise;
        } else {
          await row.update({ amountPaise: row.amountPaise - remainingToApply }, { transaction });
          await PaymentAllocation.create({ paymentId: row.paymentId, invoiceId, amountPaise: remainingToApply, createdBy: req.user?.name || null }, { transaction });
          remainingToApply = 0;
        }
      }

      await recomputeInvoiceFromAllocations(models, invoiceId, transaction);
    });

    await logActivity(models, { clientId: parseInt(clientId), invoiceId: parseInt(invoiceId), action: "advance_applied", user: req.user, amountPaise });
    await invalidateCache("payments");
    const invoice = await models.Invoice.findByPk(invoiceId);
    res.json({ success: true, message: "Advance applied", data: serializeInvoice(invoice) });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || "Error applying advance" });
  }
});

// ── Refunds ──────────────────────────────────────────────────────────────

router.post("/refunds", async (req, res) => {
  try {
    const models = req.app.locals.models;
    const { Refund } = models;
    const { clientId, amountPaise, reason, refundDate, method, relatedPaymentId } = req.body;
    if (!clientId || !amountPaise || amountPaise <= 0 || !reason) {
      return res.status(400).json({ success: false, message: "clientId, a positive amountPaise, and a reason are required" });
    }

    const available = await getClientAdvanceBalance(models, parseInt(clientId));
    if (amountPaise > available) {
      return res.status(400).json({ success: false, message: `Only ${available} paise of advance is available to refund` });
    }

    const refund = await Refund.create({
      clientId: parseInt(clientId),
      amountPaise,
      reason,
      refundDate: refundDate || todayISO(),
      method: method || null,
      relatedPaymentId: relatedPaymentId || null,
      createdBy: req.user?.name || null,
    });

    await logActivity(models, { clientId: parseInt(clientId), action: "refund_issued", user: req.user, amountPaise, metadata: { reason } });
    await invalidateCache("payments");
    res.status(201).json({ success: true, message: "Refund recorded", data: refund });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error recording refund", error: error.message });
  }
});

// ── Reminders / follow-ups ──────────────────────────────────────────────

router.post("/reminders", async (req, res) => {
  try {
    const { PaymentReminder } = req.app.locals.models;
    const { invoiceId, clientId, note, sentVia, sentAt } = req.body;
    if (!invoiceId || !clientId) return res.status(400).json({ success: false, message: "invoiceId and clientId are required" });

    const reminder = await PaymentReminder.create({
      invoiceId,
      clientId,
      note: note || null,
      sentVia: sentVia || null,
      sentAt: sentVia ? sentAt || new Date() : null,
      status: "pending",
      createdBy: req.user?.name || null,
    });

    await logActivity(req.app.locals.models, { clientId, invoiceId, action: sentVia ? "reminder_sent" : "follow_up_added", user: req.user, metadata: { sentVia, note } });
    res.status(201).json({ success: true, message: "Reminder saved", data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving reminder", error: error.message });
  }
});

router.put("/reminders/:id/complete", async (req, res) => {
  try {
    const { PaymentReminder } = req.app.locals.models;
    const reminder = await PaymentReminder.findByPk(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: "Reminder not found" });
    await reminder.update({ status: "completed" });
    res.json({ success: true, message: "Marked as completed", data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating reminder", error: error.message });
  }
});

router.get("/reminders/draft-text/:invoiceId", async (req, res) => {
  try {
    const { Invoice, Client } = req.app.locals.models;
    const invoice = await Invoice.findByPk(req.params.invoiceId, { include: [{ model: Client, as: "client" }] });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const balancePaise = invoice.totalPaise - invoice.amountPaidPaise;
    const amountRupees = (balancePaise / 100).toFixed(2);
    const clientName = invoice.client?.name || "there";
    const message = `Hi ${clientName}, this is a reminder that invoice ${invoice.invoiceNumber} for ₹${amountRupees} was due on ${invoice.dueDate}. Please let us know if you have any questions, or if payment has already been made.`;

    res.json({ success: true, data: { message, invoiceNumber: invoice.invoiceNumber, balancePaise, dueDate: invoice.dueDate, clientName, clientPhone: invoice.client?.whatsappNumber || invoice.client?.phoneNumber, clientEmail: invoice.client?.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error building reminder text", error: error.message });
  }
});

// ── Activity log ─────────────────────────────────────────────────────────

router.get("/payments/activity/:clientId", async (req, res) => {
  try {
    const { PaymentActivityLog } = req.app.locals.models;
    const logs = await PaymentActivityLog.findAll({ where: { clientId: req.params.clientId }, order: [["createdAt", "DESC"]], limit: 200 });
    res.json({ success: true, data: logs.map((l) => ({ ...l.toJSON(), metadata: l.metadata ? JSON.parse(l.metadata) : null })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching activity", error: error.message });
  }
});

// ── Reports / export ─────────────────────────────────────────────────────

async function buildReportRows(models, report, query) {
  const { Invoice, Client, Payment } = models;
  if (report === "invoice-register") {
    const invoices = await Invoice.findAll({ include: [{ model: Client, as: "client", attributes: ["name"] }], order: [["invoiceDate", "DESC"]] });
    return {
      headers: ["Invoice Number", "Client", "Invoice Date", "Due Date", "Status", "Total (INR)", "Paid (INR)", "Balance (INR)"],
      rows: invoices.map((inv) => {
        const json = serializeInvoice(inv);
        return [json.invoiceNumber, inv.client?.name || "", json.invoiceDate, json.dueDate, json.status, (json.totalPaise / 100).toFixed(2), (json.amountPaidPaise / 100).toFixed(2), ((json.totalPaise - json.amountPaidPaise) / 100).toFixed(2)];
      }),
    };
  }
  if (report === "client-outstanding" || report === "overdue-invoices") {
    const where = { status: { [Op.in]: ["issued", "partially_paid", "overdue"] } };
    const invoices = await Invoice.findAll({ where, include: [{ model: Client, as: "client", attributes: ["name"] }], order: [["dueDate", "ASC"]] });
    const today = todayISO();
    let filtered = invoices.map(serializeInvoice).filter((inv) => inv.totalPaise - inv.amountPaidPaise > 0);
    if (report === "overdue-invoices") filtered = filtered.filter((inv) => inv.dueDate < today);
    return {
      headers: ["Client", "Invoice Number", "Due Date", "Balance (INR)", "Days Overdue"],
      rows: filtered.map((inv) => {
        const daysOverdue = Math.max(Math.floor((new Date(today) - new Date(inv.dueDate)) / 86400000), 0);
        const client = invoices.find((i) => i.id === inv.id)?.client;
        return [client?.name || "", inv.invoiceNumber, inv.dueDate, ((inv.totalPaise - inv.amountPaidPaise) / 100).toFixed(2), daysOverdue];
      }),
    };
  }
  if (report === "collection-report") {
    const where = { status: "confirmed" };
    if (query.dateFrom || query.dateTo) {
      where.paymentDate = {};
      if (query.dateFrom) where.paymentDate[Op.gte] = query.dateFrom;
      if (query.dateTo) where.paymentDate[Op.lte] = query.dateTo;
    }
    const payments = await Payment.findAll({ where, include: [{ model: Client, as: "client", attributes: ["name"] }], order: [["paymentDate", "DESC"]] });
    return {
      headers: ["Date", "Client", "Amount (INR)", "Method", "Reference"],
      rows: payments.map((p) => [p.paymentDate, p.client?.name || "", (p.amountPaise / 100).toFixed(2), p.method, p.referenceNumber || ""]),
    };
  }
  if (report === "payment-method-breakdown") {
    const sequelize = Payment.sequelize;
    const rows = await sequelize.query(
      `SELECT method, COUNT(*) AS count, COALESCE(SUM("amountPaise"), 0) AS total FROM payments WHERE status = 'confirmed' GROUP BY method ORDER BY total DESC`,
      { type: QueryTypes.SELECT }
    );
    return { headers: ["Method", "Count", "Total (INR)"], rows: rows.map((r) => [r.method, r.count, (parseInt(r.total, 10) / 100).toFixed(2)]) };
  }
  return { headers: [], rows: [] };
}

router.get("/payments/export/:report", async (req, res) => {
  try {
    const { report } = req.params;
    const format = req.query.format === "xlsx" ? "xlsx" : "csv";
    const { headers, rows } = await buildReportRows(req.app.locals.models, report, req.query);

    if (format === "xlsx") {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${report}-${todayISO()}.xlsx"`);
      return res.send(buffer);
    }

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${report}-${todayISO()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ success: false, message: "Error exporting report", error: error.message });
  }
});

// ── PDF export (invoice / receipt) → Drive ──────────────────────────────

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only a PDF file is allowed"), false);
  },
});

router.post("/invoices/:id/export-pdf", wrapUpload(pdfUpload.single("pdf")), async (req, res) => {
  try {
    const { Invoice, Client, Document } = req.app.locals.models;
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "A PDF file is required" });

    const clientRecord = await Client.findByPk(invoice.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Invoices");
    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, subfolder.folderId);

    const doc = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: subfolder.folderId,
      clientId: clientRecord.id,
      invoiceId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber}`,
      documentType: "invoice_record",
      status: "active",
    });

    await logActivity(req.app.locals.models, { clientId: invoice.clientId, invoiceId: invoice.id, action: "invoice_exported", user: req.user, metadata: { documentId: doc.id } });
    await invalidateCache("documents");
    res.status(201).json({ success: true, message: "Invoice PDF saved to Drive", data: doc });
  } catch (error) {
    console.error("Error exporting invoice PDF:", error);
    res.status(500).json({ success: false, message: "Error exporting invoice PDF", error: error.message });
  }
});

router.post("/payments/:id/export-receipt-pdf", wrapUpload(pdfUpload.single("pdf")), async (req, res) => {
  try {
    const { Payment, Client, Document } = req.app.locals.models;
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "A PDF file is required" });

    const clientRecord = await Client.findByPk(payment.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Payment Receipts");
    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, subfolder.folderId);

    const doc = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: subfolder.folderId,
      clientId: clientRecord.id,
      description: `Payment receipt (${new Date(payment.paymentDate).toLocaleDateString()})`,
      documentType: "payment_receipt",
      status: "active",
    });

    await logActivity(req.app.locals.models, { clientId: payment.clientId, paymentId: payment.id, action: "receipt_exported", user: req.user, metadata: { documentId: doc.id } });
    await invalidateCache("documents");
    res.status(201).json({ success: true, message: "Receipt PDF saved to Drive", data: doc });
  } catch (error) {
    console.error("Error exporting receipt PDF:", error);
    res.status(500).json({ success: false, message: "Error exporting receipt PDF", error: error.message });
  }
});

export default router;
