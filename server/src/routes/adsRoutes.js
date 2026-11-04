import express from "express";
import { Op, QueryTypes } from "sequelize";
import { requireAdmin } from "../middleware/auth.js";
import { cacheRoute } from "../middleware/cacheRoute.js";
import { invalidateCache } from "../utils/serverCache.js";
import { ADS_PLATFORMS, getPlatformConfigStatus, syncAds } from "../utils/adsSync.js";
import { isMetaConfigured, listMetaPages, subscribePageToLeadgen } from "../utils/metaAdsApi.js";

const router = express.Router();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_RANGE_DAYS = 30;
// Campaigns in these states are listed even with no spend in the range.
const LIVE_STATUSES = new Set(["ENABLED", "ACTIVE"]);

// ?from=&to= (inclusive YYYY-MM-DD), defaulting to the last 30 days.
function readRange(query) {
  const to = ISO_DATE.test(query.to || "") ? query.to : new Date().toISOString().slice(0, 10);
  let from = query.from;
  if (!ISO_DATE.test(from || "")) {
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (DEFAULT_RANGE_DAYS - 1));
    from = d.toISOString().slice(0, 10);
  }
  return from <= to ? { from, to } : { from: to, to: from };
}

// pg returns SUM() of BIGINT/DECIMAL as strings.
const toNumbers = (row) => ({
  impressions: Number(row.impressions || 0),
  clicks: Number(row.clicks || 0),
  spendMinor: Number(row.spendMinor || 0),
  conversions: Number(row.conversions || 0),
  conversionValueMinor: Number(row.conversionValueMinor || 0),
  leads: Number(row.leads || 0),
});

const METRIC_SUMS = `
  COALESCE(SUM(m.impressions), 0) AS "impressions",
  COALESCE(SUM(m.clicks), 0) AS "clicks",
  COALESCE(SUM(m."spendMinor"), 0) AS "spendMinor",
  COALESCE(SUM(m.conversions), 0) AS "conversions",
  COALESCE(SUM(m."conversionValueMinor"), 0) AS "conversionValueMinor",
  COALESCE(SUM(m.leads), 0) AS "leads"`;

// ── Client Ads tabs (every signed-in user — the tabs are visible to the
//    whole team, same as the rest of the client profile) ──────────────────

router.get("/ads/clients/:clientId/summary", cacheRoute("ads", 300), async (req, res) => {
  try {
    const { AdAccount, AdCampaign, AdLead, AdSyncLog } = req.app.locals.models;
    const sequelize = AdAccount.sequelize;
    const clientId = parseInt(req.params.clientId, 10);
    const platform = req.query.platform;
    if (!ADS_PLATFORMS.includes(platform)) {
      return res.status(400).json({ success: false, message: `platform must be one of: ${ADS_PLATFORMS.join(", ")}` });
    }
    const { from, to } = readRange(req.query);

    const accounts = await AdAccount.findAll({
      where: { clientId, platform },
      attributes: ["id", "externalAccountId", "name", "currency", "status", "lastSyncedAt", "lastSyncError"],
      order: [["name", "ASC"]],
    });
    const lastSync = await AdSyncLog.findOne({ where: { platform }, order: [["startedAt", "DESC"]], attributes: ["status", "startedAt", "finishedAt"] });
    const base = { platform, from, to, configured: getPlatformConfigStatus()[platform], lastSync, accounts };

    if (accounts.length === 0) {
      return res.json({ success: true, data: { ...base, totals: [], daily: [], campaigns: [], formLeads: 0, recentLeads: [] } });
    }
    const accountIds = accounts.map((a) => a.id);
    const replacements = { accountIds, from, to };

    const dailyRows = await sequelize.query(
      `SELECT m."date", m.currency, ${METRIC_SUMS}
       FROM ad_daily_metrics m
       WHERE m."adAccountId" IN (:accountIds) AND m.level = 'campaign' AND m."date" BETWEEN :from AND :to
       GROUP BY m."date", m.currency
       ORDER BY m."date" ASC`,
      { replacements, type: QueryTypes.SELECT }
    );
    const daily = dailyRows.map((r) => ({ date: r.date, currency: r.currency, ...toNumbers(r) }));

    // One totals entry per currency — never add INR and USD together.
    const totalsByCurrency = new Map();
    for (const day of daily) {
      const t = totalsByCurrency.get(day.currency) || { currency: day.currency, impressions: 0, clicks: 0, spendMinor: 0, conversions: 0, conversionValueMinor: 0, leads: 0 };
      for (const key of ["impressions", "clicks", "spendMinor", "conversions", "conversionValueMinor", "leads"]) t[key] += day[key];
      totalsByCurrency.set(day.currency, t);
    }
    const totals = [...totalsByCurrency.values()].sort((a, b) => b.spendMinor - a.spendMinor);

    const campaignMetricRows = await sequelize.query(
      `SELECT m."adAccountId", m."externalId", ${METRIC_SUMS}
       FROM ad_daily_metrics m
       WHERE m."adAccountId" IN (:accountIds) AND m.level = 'campaign' AND m."date" BETWEEN :from AND :to
       GROUP BY m."adAccountId", m."externalId"`,
      { replacements, type: QueryTypes.SELECT }
    );
    const metricsByCampaign = new Map(campaignMetricRows.map((r) => [`${r.adAccountId}:${r.externalId}`, toNumbers(r)]));

    const accountById = new Map(accounts.map((a) => [a.id, a]));
    const campaignRows = await AdCampaign.findAll({
      where: { adAccountId: accountIds },
      attributes: ["adAccountId", "externalCampaignId", "name", "status", "objective", "dailyBudgetMinor", "lifetimeBudgetMinor"],
    });
    const campaigns = campaignRows.map((c) => {
      const key = `${c.adAccountId}:${c.externalCampaignId}`;
      const metrics = metricsByCampaign.get(key);
      metricsByCampaign.delete(key);
      return {
        externalCampaignId: c.externalCampaignId,
        name: c.name,
        status: c.status,
        objective: c.objective,
        dailyBudgetMinor: c.dailyBudgetMinor != null ? Number(c.dailyBudgetMinor) : null,
        lifetimeBudgetMinor: c.lifetimeBudgetMinor != null ? Number(c.lifetimeBudgetMinor) : null,
        accountName: accountById.get(c.adAccountId)?.name || null,
        currency: accountById.get(c.adAccountId)?.currency || null,
        hasActivity: Boolean(metrics),
        ...(metrics || toNumbers({})),
      };
    });
    // Spend on campaigns the campaign list no longer returns (e.g. archived
    // on Meta) still belongs in the table, so the rows add up to the totals.
    for (const [key, metrics] of metricsByCampaign) {
      const [adAccountId, externalId] = key.split(":");
      const account = accountById.get(Number(adAccountId));
      campaigns.push({
        externalCampaignId: externalId,
        name: null,
        status: "ARCHIVED",
        objective: null,
        dailyBudgetMinor: null,
        lifetimeBudgetMinor: null,
        accountName: account?.name || null,
        currency: account?.currency || null,
        hasActivity: true,
        ...metrics,
      });
    }
    const visibleCampaigns = campaigns
      .filter((c) => c.hasActivity || LIVE_STATUSES.has(c.status))
      .sort((a, b) => b.spendMinor - a.spendMinor);

    const leadWhere = {
      adAccountId: accountIds,
      leadCreatedAt: { [Op.between]: [new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59.999`)] },
    };
    const [formLeads, recentLeads] = await Promise.all([
      AdLead.count({ where: leadWhere }),
      AdLead.findAll({
        where: leadWhere,
        attributes: ["id", "fullName", "email", "phone", "campaignName", "formName", "leadCreatedAt", "leadId", "isTest"],
        order: [["leadCreatedAt", "DESC"]],
        limit: 10,
      }),
    ]);

    res.json({ success: true, data: { ...base, totals, daily, campaigns: visibleCampaigns, formLeads, recentLeads } });
  } catch (error) {
    console.error("Error fetching client ads summary:", error);
    res.status(500).json({ success: false, message: "Error fetching ads data", error: error.message });
  }
});

// ── Admin: connection status, account linking, sync ─────────────────────

router.get("/ads/status", requireAdmin, async (req, res) => {
  try {
    const { AdSyncLog, AdAccount } = req.app.locals.models;
    const configured = getPlatformConfigStatus();
    const platforms = {};
    for (const platform of ADS_PLATFORMS) {
      const [lastSync, accountCount, linkedCount] = await Promise.all([
        AdSyncLog.findOne({ where: { platform }, order: [["startedAt", "DESC"]] }),
        AdAccount.count({ where: { platform } }),
        AdAccount.count({ where: { platform, clientId: { [Op.ne]: null } } }),
      ]);
      platforms[platform] = { configured: configured[platform], lastSync, accountCount, linkedCount };
    }
    const recentLogs = await AdSyncLog.findAll({ order: [["startedAt", "DESC"]], limit: 15 });
    res.json({
      success: true,
      data: {
        platforms,
        recentLogs,
        webhooks: {
          googleLeadsKeySet: Boolean(process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY),
          metaVerifyTokenSet: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
          metaAppSecretSet: Boolean(process.env.META_APP_SECRET),
          cronSecretSet: Boolean(process.env.ADS_SYNC_SECRET),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching ads status:", error);
    res.status(500).json({ success: false, message: "Error fetching ads status", error: error.message });
  }
});

router.get("/ads/accounts", requireAdmin, async (req, res) => {
  try {
    const { AdAccount, Client } = req.app.locals.models;
    const accounts = await AdAccount.findAll({
      include: [{ model: Client, as: "client", attributes: ["id", "name"] }],
      order: [["platform", "ASC"], ["name", "ASC"]],
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error("Error fetching ad accounts:", error);
    res.status(500).json({ success: false, message: "Error fetching ad accounts", error: error.message });
  }
});

router.put("/ads/accounts/:id", requireAdmin, async (req, res) => {
  try {
    const { AdAccount, Client } = req.app.locals.models;
    const account = await AdAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: "Ad account not found" });

    const updates = {};
    if ("clientId" in req.body) {
      const clientId = req.body.clientId === null || req.body.clientId === "" ? null : parseInt(req.body.clientId, 10);
      if (clientId !== null && !(await Client.findByPk(clientId, { attributes: ["id"] }))) {
        return res.status(400).json({ success: false, message: "Client not found" });
      }
      updates.clientId = clientId;
    }
    if ("syncEnabled" in req.body) updates.syncEnabled = Boolean(req.body.syncEnabled);

    await account.update(updates);
    await invalidateCache("ads");
    const fresh = await AdAccount.findByPk(account.id, { include: [{ model: Client, as: "client", attributes: ["id", "name"] }] });
    res.json({ success: true, data: fresh });
  } catch (error) {
    console.error("Error updating ad account:", error);
    res.status(500).json({ success: false, message: "Error updating ad account", error: error.message });
  }
});

router.post("/ads/sync", requireAdmin, async (req, res) => {
  try {
    const { days, platform } = req.body || {};
    if (platform && !ADS_PLATFORMS.includes(platform)) {
      return res.status(400).json({ success: false, message: `platform must be one of: ${ADS_PLATFORMS.join(", ")}` });
    }
    const results = await syncAds(req.app.locals.models, { days, platform, trigger: "manual" });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error syncing ads:", error);
    res.status(500).json({ success: false, message: "Error syncing ads", error: error.message });
  }
});

// Agency-wide totals for the Ad Accounts page.
router.get("/ads/overview", requireAdmin, cacheRoute("ads", 300), async (req, res) => {
  try {
    const { from, to } = readRange(req.query);
    const rows = await req.app.locals.models.AdAccount.sequelize.query(
      `SELECT a.platform, a.currency, a."clientId", c.name AS "clientName", ${METRIC_SUMS}
       FROM ad_daily_metrics m
       JOIN ad_accounts a ON a.id = m."adAccountId"
       LEFT JOIN clients c ON c.id = a."clientId"
       WHERE m.level = 'campaign' AND m."date" BETWEEN :from AND :to
       GROUP BY a.platform, a.currency, a."clientId", c.name
       ORDER BY SUM(m."spendMinor") DESC`,
      { replacements: { from, to }, type: QueryTypes.SELECT }
    );
    const byClient = rows.map((r) => ({ platform: r.platform, currency: r.currency, clientId: r.clientId, clientName: r.clientName, ...toNumbers(r) }));

    const totals = new Map();
    for (const row of byClient) {
      const key = `${row.platform}:${row.currency}`;
      const t = totals.get(key) || { platform: row.platform, currency: row.currency, impressions: 0, clicks: 0, spendMinor: 0, conversions: 0, conversionValueMinor: 0, leads: 0 };
      for (const k of ["impressions", "clicks", "spendMinor", "conversions", "conversionValueMinor", "leads"]) t[k] += row[k];
      totals.set(key, t);
    }
    res.json({ success: true, data: { from, to, totals: [...totals.values()], byClient } });
  } catch (error) {
    console.error("Error fetching ads overview:", error);
    res.status(500).json({ success: false, message: "Error fetching ads overview", error: error.message });
  }
});

// Turns on instant lead delivery: subscribes the app to every Page's
// `leadgen` webhook. Needs the webhook itself configured in the Meta app.
router.post("/ads/meta/subscribe-pages", requireAdmin, async (req, res) => {
  try {
    if (!isMetaConfigured()) return res.status(400).json({ success: false, message: "META_SYSTEM_USER_TOKEN is not set" });
    const pages = await listMetaPages();
    const results = [];
    for (const page of pages) {
      try {
        await subscribePageToLeadgen(page);
        results.push({ pageId: page.id, name: page.name, subscribed: true });
      } catch (err) {
        results.push({ pageId: page.id, name: page.name, subscribed: false, error: err.message });
      }
    }
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error subscribing Meta pages:", error);
    res.status(500).json({ success: false, message: "Error subscribing Meta pages", error: error.message });
  }
});

export default router;
