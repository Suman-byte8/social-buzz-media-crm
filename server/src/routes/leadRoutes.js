import express from "express";
import { Op } from "sequelize";

const router = express.Router();

const STATUS_VALUES = ["new", "contacted", "qualified", "hot", "lost"];

const prepareLeadData = (body) => ({
  companyName: body.companyName,
  contactName: body.contactName || null,
  email: body.email || null,
  phone: body.phone || null,
  source: body.source || null,
  status: STATUS_VALUES.includes(body.status) ? body.status : "new",
  notes: body.notes || null,
  lastContactAt: body.lastContactAt ? new Date(body.lastContactAt) : null,
  nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
});

// Same field set as prepareLeadData, but only including keys the caller
// actually sent — an update should never silently null out fields the
// caller didn't touch (e.g. a quick "log a call" action that only sends
// { lastContactAt }).
const prepareLeadUpdateData = (body) => {
  const data = {};
  if (body.companyName !== undefined) data.companyName = body.companyName;
  if (body.contactName !== undefined) data.contactName = body.contactName || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.source !== undefined) data.source = body.source || null;
  if (body.status !== undefined && STATUS_VALUES.includes(body.status)) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.lastContactAt !== undefined) data.lastContactAt = body.lastContactAt ? new Date(body.lastContactAt) : null;
  if (body.nextFollowUpAt !== undefined) data.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null;
  return data;
};

// GET /api/leads - list with pagination, search, status/source filters, sort
router.get("/leads", async (req, res) => {
  try {
    const { Lead } = req.app.locals.models;
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      source,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { companyName: { [Op.iLike]: `%${search}%` } },
        { contactName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status && STATUS_VALUES.includes(status)) where.status = status;
    if (source) where.source = source;

    const { count, rows } = await Lead.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching leads", error: error.message });
  }
});

// GET /api/leads/metrics - pipeline summary for the overview cards
router.get("/leads/metrics", async (req, res) => {
  try {
    const { Lead } = req.app.locals.models;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalLeads, hotProspects, followUpDue, lostThisMonth, newThisMonth] = await Promise.all([
      Lead.count(),
      Lead.count({ where: { status: "hot" } }),
      Lead.count({
        where: {
          nextFollowUpAt: { [Op.lte]: endOfToday },
          status: { [Op.notIn]: ["lost"] },
        },
      }),
      Lead.count({ where: { status: "lost", updatedAt: { [Op.gte]: startOfMonth } } }),
      Lead.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
    ]);

    res.json({
      success: true,
      data: { totalLeads, hotProspects, followUpDue, lostThisMonth, newThisMonth },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching lead metrics", error: error.message });
  }
});

// POST /api/leads - create a new lead
router.post("/leads", async (req, res) => {
  try {
    const { Lead } = req.app.locals.models;
    const leadData = prepareLeadData(req.body);

    if (!leadData.companyName) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const lead = await Lead.create(leadData);
    res.status(201).json({ success: true, message: "Lead created successfully", data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating lead", error: error.message });
  }
});

// PUT /api/leads/:id - update a lead
router.put("/leads/:id", async (req, res) => {
  try {
    const { Lead } = req.app.locals.models;
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    await lead.update(prepareLeadUpdateData(req.body));
    res.json({ success: true, message: "Lead updated successfully", data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating lead", error: error.message });
  }
});

// DELETE /api/leads/:id
router.delete("/leads/:id", async (req, res) => {
  try {
    const { Lead } = req.app.locals.models;
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    await lead.destroy();
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting lead", error: error.message });
  }
});

// POST /api/leads/:id/convert - turn a won lead into a real Client, then
// remove it from the pipeline (it's no longer a "potential" client).
router.post("/leads/:id/convert", async (req, res) => {
  try {
    const { Lead, Client } = req.app.locals.models;
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    const client = await Client.create({
      name: lead.companyName,
      email: lead.email,
      phoneNumber: lead.phone,
      notes: lead.notes,
    });

    await lead.destroy();

    res.status(201).json({
      success: true,
      message: "Lead converted to client successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error converting lead", error: error.message });
  }
});

export default router;
