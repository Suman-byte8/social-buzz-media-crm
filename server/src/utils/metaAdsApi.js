import crypto from "crypto";

// Meta Marketing API (Graph API) over plain fetch. One Business Manager
// "system user" token reads every ad account and Page assigned to it —
// including client accounts shared with the agency's business as a partner.
//
// Required env:  META_SYSTEM_USER_TOKEN
// Recommended:   META_APP_SECRET (signs every call with appsecret_proof, and
//                verifies lead webhooks)
// Optional env:  META_API_VERSION (e.g. "v23.0")

const API_VERSION = process.env.META_API_VERSION || "v23.0";
const GRAPH_BASE = `https://graph.facebook.com/${API_VERSION}`;

export const isMetaConfigured = () => Boolean(process.env.META_SYSTEM_USER_TOKEN);

const appSecretProof = (token) =>
  process.env.META_APP_SECRET
    ? crypto.createHmac("sha256", process.env.META_APP_SECRET).update(token).digest("hex")
    : null;

function buildUrl(pathOrUrl, params, token) {
  const url = new URL(pathOrUrl.startsWith("http") ? pathOrUrl : `${GRAPH_BASE}/${pathOrUrl.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  url.searchParams.set("access_token", token);
  const proof = appSecretProof(token);
  if (proof) url.searchParams.set("appsecret_proof", proof);
  return url;
}

async function graphRequest(method, pathOrUrl, params = {}, token = process.env.META_SYSTEM_USER_TOKEN) {
  const res = await fetch(buildUrl(pathOrUrl, params, token), { method });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error || {};
    // Codes 17 / 80004 / 613 are rate limits — the next scheduled run retries.
    throw new Error(`Meta API: ${err.message || `HTTP ${res.status}`}${err.code ? ` (code ${err.code})` : ""}`);
  }
  return data;
}

export const graphGet = (path, params, token) => graphRequest("GET", path, params, token);
export const graphPost = (path, params, token) => graphRequest("POST", path, params, token);

// Follows `paging.next` until every row is collected. `paging.next` already
// carries the token and query, so later pages are fetched as-is.
async function graphGetAll(path, params = {}, token = process.env.META_SYSTEM_USER_TOKEN) {
  const rows = [];
  let data = await graphGet(path, { limit: 200, ...params }, token);
  rows.push(...(data.data || []));
  while (data.paging?.next) {
    const res = await fetch(data.paging.next);
    data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(`Meta API: ${data.error?.message || `HTTP ${res.status}`}`);
    rows.push(...(data.data || []));
  }
  return rows;
}

const ACCOUNT_STATUS = { 1: "ACTIVE", 2: "DISABLED", 3: "UNSETTLED", 7: "PENDING_RISK_REVIEW", 8: "PENDING_SETTLEMENT", 9: "IN_GRACE_PERIOD", 100: "PENDING_CLOSURE", 101: "CLOSED" };

// → [{ externalAccountId, name, currency, timezone, status }]
export async function listMetaAdAccounts() {
  const rows = await graphGetAll("me/adaccounts", { fields: "account_id,name,currency,timezone_name,account_status" });
  return rows.map((a) => ({
    externalAccountId: `act_${a.account_id}`,
    name: a.name || null,
    currency: a.currency || null,
    timezone: a.timezone_name || null,
    status: ACCOUNT_STATUS[a.account_status] || String(a.account_status ?? ""),
  }));
}

// Meta returns budgets already in minor units (paise/cents), as strings.
const toMinorOrNull = (value) => (value === undefined || value === null || value === "" ? null : Number(value));
const toDateOrNull = (value) => (value ? String(value).slice(0, 10) : null);

export async function fetchMetaCampaigns(accountId) {
  const rows = await graphGetAll(`${accountId}/campaigns`, {
    fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time",
  });
  return rows.map((c) => ({
    externalCampaignId: String(c.id),
    name: c.name || null,
    status: c.effective_status || c.status || null,
    objective: c.objective || null,
    dailyBudgetMinor: toMinorOrNull(c.daily_budget),
    lifetimeBudgetMinor: toMinorOrNull(c.lifetime_budget),
    startDate: toDateOrNull(c.start_time),
    endDate: toDateOrNull(c.stop_time),
    raw: c,
  }));
}

// Meta reports results as a list of "actions". "lead" is Meta's own rollup
// of every lead type, so it's preferred over the narrower variants (adding
// them together would double count).
const LEAD_ACTIONS = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];
const PURCHASE_ACTIONS = ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"];

function firstActionValue(list, types) {
  for (const type of types) {
    const hit = (list || []).find((a) => a.action_type === type);
    if (hit) return Number(hit.value || 0);
  }
  return 0;
}

// Per-campaign, per-day insights for an inclusive YYYY-MM-DD range.
export async function fetchMetaDailyMetrics(accountId, since, until) {
  const rows = await graphGetAll(`${accountId}/insights`, {
    level: "campaign",
    time_increment: 1,
    time_range: { since, until },
    fields: "campaign_id,date_start,impressions,reach,clicks,spend,actions,action_values,account_currency",
    limit: 500,
  });
  return rows.map((r) => {
    const leads = firstActionValue(r.actions, LEAD_ACTIONS);
    const purchases = firstActionValue(r.actions, PURCHASE_ACTIONS);
    return {
      externalId: String(r.campaign_id),
      date: r.date_start,
      impressions: Number(r.impressions || 0),
      clicks: Number(r.clicks || 0),
      // `spend` is a decimal string in the account currency's major unit.
      spendMinor: Math.round(parseFloat(r.spend || "0") * 100),
      reach: r.reach != null ? Number(r.reach) : null,
      // Meta has no single "conversions" number; leads + purchases is the
      // closest equivalent. The full actions list is kept in `extra`.
      conversions: leads + purchases,
      conversionValueMinor: Math.round(firstActionValue(r.action_values, PURCHASE_ACTIONS) * 100),
      leads: Math.round(leads),
      extra: r.actions ? { actions: r.actions } : null,
    };
  });
}

// ── Lead Ads ────────────────────────────────────────────────────────────

// Pages assigned to the system user, each with its own Page access token
// (lead forms and leads are read with the Page token, not the user token).
export async function listMetaPages() {
  return graphGetAll("me/accounts", { fields: "id,name,access_token" });
}

export async function listMetaLeadForms(page) {
  return graphGetAll(`${page.id}/leadgen_forms`, { fields: "id,name,status" }, page.access_token);
}

const LEAD_FIELDS = "id,created_time,field_data,ad_id,campaign_id,campaign_name,form_id,is_organic,platform";

export async function fetchMetaFormLeads(formId, sinceUnix, pageToken) {
  return graphGetAll(
    `${formId}/leads`,
    {
      fields: LEAD_FIELDS,
      filtering: [{ field: "time_created", operator: "GREATER_THAN", value: sinceUnix }],
    },
    pageToken
  );
}

export async function fetchMetaLead(leadgenId, pageToken) {
  return graphGet(leadgenId, { fields: LEAD_FIELDS }, pageToken);
}

// Subscribes this app to a Page's `leadgen` webhook so new leads are pushed
// instantly instead of waiting for the next scheduled poll.
export async function subscribePageToLeadgen(page) {
  return graphPost(`${page.id}/subscribed_apps`, { subscribed_fields: "leadgen" }, page.access_token);
}
