import { Op } from "sequelize";
import { invalidateCache } from "./serverCache.js";
import {
  isGoogleAdsConfigured,
  listGoogleAdsAccounts,
  fetchGoogleAdsCampaigns,
  fetchGoogleAdsDailyMetrics,
} from "./googleAdsApi.js";
import {
  isMetaConfigured,
  listMetaAdAccounts,
  fetchMetaCampaigns,
  fetchMetaDailyMetrics,
  listMetaPages,
  listMetaLeadForms,
  fetchMetaFormLeads,
  fetchMetaLead,
} from "./metaAdsApi.js";

// Each platform exposes the same four calls, so the sync loop below is
// written once for both.
const PROVIDERS = {
  google_ads: {
    isConfigured: isGoogleAdsConfigured,
    listAccounts: listGoogleAdsAccounts,
    fetchCampaigns: fetchGoogleAdsCampaigns,
    fetchDailyMetrics: fetchGoogleAdsDailyMetrics,
  },
  meta: {
    isConfigured: isMetaConfigured,
    listAccounts: listMetaAdAccounts,
    fetchCampaigns: fetchMetaCampaigns,
    fetchDailyMetrics: fetchMetaDailyMetrics,
  },
};

export const ADS_PLATFORMS = Object.keys(PROVIDERS);
export const getPlatformConfigStatus = () => ({ google_ads: isGoogleAdsConfigured(), meta: isMetaConfigured() });

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
// A "running" log older than this is treated as a crashed run, not a lock.
const LOCK_WINDOW_MS = 30 * 60 * 1000;
const UPSERT_CHUNK = 500;

const METRIC_UPDATE_FIELDS = [
  "impressions",
  "clicks",
  "spendMinor",
  "currency",
  "reach",
  "conversions",
  "conversionValueMinor",
  "leads",
  "extra",
  "updatedAt",
];

// "YYYY-MM-DD" for today in an IANA timezone — both platforms report dates
// in the ad account's own timezone, not the server's.
function todayIn(timezone) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function shiftDate(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function upsertCampaigns(models, platform, adAccountId, campaigns) {
  if (!campaigns.length) return;
  await models.AdCampaign.bulkCreate(
    campaigns.map((c) => ({ ...c, platform, adAccountId })),
    {
      conflictAttributes: ["platform", "externalCampaignId"],
      updateOnDuplicate: ["adAccountId", "name", "status", "objective", "dailyBudgetMinor", "lifetimeBudgetMinor", "startDate", "endDate", "raw", "updatedAt"],
    }
  );
}

async function upsertDailyMetrics(models, account, metrics) {
  for (let i = 0; i < metrics.length; i += UPSERT_CHUNK) {
    const chunk = metrics.slice(i, i + UPSERT_CHUNK).map((m) => ({
      ...m,
      adAccountId: account.id,
      level: "campaign",
      currency: account.currency,
    }));
    await models.AdDailyMetric.bulkCreate(chunk, {
      conflictAttributes: ["adAccountId", "level", "externalId", "date"],
      updateOnDuplicate: METRIC_UPDATE_FIELDS,
    });
  }
}

async function syncPlatform(models, platform, { days, trigger }) {
  const provider = PROVIDERS[platform];
  if (!provider.isConfigured()) {
    return { platform, status: "skipped", message: "API credentials are not configured on the server" };
  }

  const { AdAccount, AdSyncLog } = models;
  const running = await AdSyncLog.findOne({
    where: { platform, status: "running", startedAt: { [Op.gt]: new Date(Date.now() - LOCK_WINDOW_MS) } },
  });
  if (running) return { platform, status: "skipped", message: "A sync for this platform is already running" };

  const previousOk = await AdSyncLog.findOne({
    where: { platform, status: { [Op.in]: ["ok", "partial"] } },
    order: [["startedAt", "DESC"]],
  });
  const log = await AdSyncLog.create({ platform, trigger, status: "running" });

  const errors = [];
  let accountsSynced = 0;
  let rowsUpserted = 0;
  let leadsImported = 0;
  let dateFrom = null;
  let dateTo = null;

  try {
    const discovered = await provider.listAccounts();
    if (discovered.length) {
      // Only platform-owned fields are overwritten — clientId and
      // syncEnabled are the CRM's own settings and survive every sync.
      await AdAccount.bulkCreate(
        discovered.map((a) => ({ ...a, platform })),
        { conflictAttributes: ["platform", "externalAccountId"], updateOnDuplicate: ["name", "currency", "timezone", "status", "updatedAt"] }
      );
    }

    const accounts = await AdAccount.findAll({ where: { platform, syncEnabled: true } });
    for (const account of accounts) {
      const until = todayIn(account.timezone);
      const since = shiftDate(until, -(days - 1));
      if (!dateFrom || since < dateFrom) dateFrom = since;
      if (!dateTo || until > dateTo) dateTo = until;

      try {
        const campaigns = await provider.fetchCampaigns(account.externalAccountId);
        await upsertCampaigns(models, platform, account.id, campaigns);

        const metrics = await provider.fetchDailyMetrics(account.externalAccountId, since, until);
        await upsertDailyMetrics(models, account, metrics);

        rowsUpserted += metrics.length;
        accountsSynced += 1;
        await account.update({ lastSyncedAt: new Date(), lastSyncError: null });
      } catch (err) {
        errors.push(`${account.name || account.externalAccountId}: ${err.message}`);
        await account.update({ lastSyncError: err.message });
      }
    }

    if (platform === "meta") {
      // Re-read a day of overlap past the last good run; duplicates are
      // dropped by the unique key, so overlap is free.
      const fallbackSince = new Date(Date.now() - days * 86_400_000);
      const since = previousOk ? new Date(Math.max(previousOk.startedAt.getTime() - 86_400_000, Date.now() - MAX_DAYS * 86_400_000)) : fallbackSince;
      const result = await pollMetaLeads(models, since);
      leadsImported = result.imported;
      errors.push(...result.errors);
    }
  } catch (err) {
    errors.push(err.message);
  }

  const status = errors.length === 0 ? "ok" : accountsSynced > 0 || leadsImported > 0 ? "partial" : "error";
  await log.update({
    status,
    finishedAt: new Date(),
    accountsSynced,
    rowsUpserted,
    leadsImported,
    dateFrom,
    dateTo,
    error: errors.length ? errors.join("\n") : null,
  });

  return { platform, status, accountsSynced, rowsUpserted, leadsImported, errors };
}

// Entry point for both the "Sync now" button and the scheduled job.
export async function syncAds(models, { days = DEFAULT_DAYS, platform, trigger = "manual" } = {}) {
  const span = Math.min(Math.max(parseInt(days, 10) || DEFAULT_DAYS, 1), MAX_DAYS);
  const platforms = platform ? [platform] : ADS_PLATFORMS;

  const results = [];
  for (const p of platforms) {
    if (!PROVIDERS[p]) throw new Error(`Unknown ads platform "${p}"`);
    results.push(await syncPlatform(models, p, { days: span, trigger }));
  }
  await invalidateCache("ads");
  return results;
}

// ── Lead ingestion ──────────────────────────────────────────────────────

const PLATFORM_SOURCE = { meta: "Meta Lead Ad", google_ads: "Google Lead Form" };

// Pulls name/email/phone/company out of a form's answers. Both platforms
// use the same standard keys (Meta field names, Google column ids lowercased).
function pickContact(fields) {
  const get = (key) => (fields[key] ? String(fields[key]).trim() : null);
  const fullName = get("full_name") || [get("first_name"), get("last_name")].filter(Boolean).join(" ") || null;
  return {
    fullName,
    email: get("email") || get("work_email"),
    phone: get("phone_number") || get("work_phone"),
    company: get("company_name"),
  };
}

export function normalizeMetaLead(raw, form = {}) {
  const answers = Object.fromEntries((raw.field_data || []).map((f) => [f.name, (f.values || []).join(", ")]));
  const contact = pickContact(answers);
  return {
    platform: "meta",
    externalLeadId: String(raw.id),
    externalCampaignId: raw.campaign_id ? String(raw.campaign_id) : null,
    campaignName: raw.campaign_name || null,
    externalAdId: raw.ad_id ? String(raw.ad_id) : null,
    formId: raw.form_id ? String(raw.form_id) : form.id ? String(form.id) : null,
    formName: form.name || null,
    fullName: contact.fullName,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    answers,
    isTest: false,
    leadCreatedAt: raw.created_time ? new Date(raw.created_time) : new Date(),
  };
}

// Body of a Google Ads lead form webhook POST.
export function normalizeGoogleLead(body) {
  const standard = {};
  const answers = {};
  for (const col of body.user_column_data || []) {
    const id = col.column_id ? String(col.column_id).toLowerCase() : null;
    if (id) standard[id] = col.string_value;
    answers[col.column_name || id || "field"] = col.string_value;
  }
  const contact = pickContact(standard);
  return {
    platform: "google_ads",
    externalLeadId: String(body.lead_id),
    externalCampaignId: body.campaign_id ? String(body.campaign_id) : null,
    campaignName: null,
    externalAdId: body.creative_id ? String(body.creative_id) : null,
    formId: body.form_id ? String(body.form_id) : null,
    formName: null,
    fullName: contact.fullName,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    answers,
    isTest: Boolean(body.is_test),
    leadCreatedAt: new Date(),
  };
}

// Stores one ad lead and creates the matching CRM Lead. Safe to call twice
// for the same lead (webhook + poll): returns false when it already exists.
export async function ingestAdLead(models, lead) {
  const { AdLead, AdCampaign, Lead } = models;

  const existing = await AdLead.findOne({ where: { platform: lead.platform, externalLeadId: lead.externalLeadId }, attributes: ["id"] });
  if (existing) return false;

  let adAccountId = null;
  let campaignName = lead.campaignName;
  if (lead.externalCampaignId) {
    const campaign = await AdCampaign.findOne({
      where: { platform: lead.platform, externalCampaignId: lead.externalCampaignId },
      attributes: ["adAccountId", "name"],
    });
    adAccountId = campaign?.adAccountId || null;
    campaignName = campaignName || campaign?.name || null;
  }

  const { company, ...adLeadFields } = lead;
  let adLead;
  try {
    adLead = await AdLead.create({ ...adLeadFields, adAccountId, campaignName });
  } catch (err) {
    // Lost a race with a concurrent webhook/poll for the same lead.
    if (err.name === "SequelizeUniqueConstraintError") return false;
    throw err;
  }

  const source = `${PLATFORM_SOURCE[lead.platform] || "Ad"}${lead.isTest ? " (test)" : ""}`;
  const noteLines = [
    `Captured from ${source}.`,
    lead.formName || lead.formId ? `Form: ${lead.formName || lead.formId}` : null,
    campaignName || lead.externalCampaignId ? `Campaign: ${campaignName || lead.externalCampaignId}` : null,
    "",
    ...Object.entries(lead.answers || {}).map(([question, answer]) => `${question}: ${answer}`),
  ].filter((line) => line !== null);

  const crmLead = await Lead.create({
    // companyName is required on Lead; most lead forms don't ask for it.
    companyName: company || lead.fullName || lead.email || `${PLATFORM_SOURCE[lead.platform] || "Ad"} lead`,
    contactName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    source,
    status: "new",
    notes: noteLines.join("\n"),
  });
  await adLead.update({ leadId: crmLead.id });
  return true;
}

// Page access tokens rarely change; cache them briefly so a burst of lead
// webhooks doesn't refetch the page list for every single lead.
let pagesCache = null;
async function getMetaPages() {
  if (pagesCache && pagesCache.expiresAt > Date.now()) return pagesCache.pages;
  const pages = await listMetaPages();
  pagesCache = { pages, expiresAt: Date.now() + 10 * 60 * 1000 };
  return pages;
}

// Polls every lead form on every Page the system user can see. A Page that
// fails (usually missing Leads Access) is reported and skipped, not fatal.
async function pollMetaLeads(models, since) {
  const errors = [];
  let imported = 0;
  let pages;
  try {
    pages = await getMetaPages();
  } catch (err) {
    return { imported, errors: [`Lead forms: ${err.message}`] };
  }

  const sinceUnix = Math.floor(since.getTime() / 1000);
  for (const page of pages) {
    try {
      const forms = await listMetaLeadForms(page);
      for (const form of forms) {
        const leads = await fetchMetaFormLeads(form.id, sinceUnix, page.access_token);
        for (const raw of leads) {
          if (await ingestAdLead(models, normalizeMetaLead(raw, form))) imported += 1;
        }
      }
    } catch (err) {
      errors.push(`Leads from page "${page.name}": ${err.message}`);
    }
  }
  return { imported, errors };
}

// Handles one `leadgen` change from the Meta Page webhook.
export async function ingestMetaLeadgenEvent(models, value) {
  const pages = await getMetaPages().catch(() => []);
  const page = pages.find((p) => String(p.id) === String(value.page_id));
  const raw = await fetchMetaLead(value.leadgen_id, page?.access_token);
  return ingestAdLead(models, normalizeMetaLead(raw, { id: value.form_id }));
}
