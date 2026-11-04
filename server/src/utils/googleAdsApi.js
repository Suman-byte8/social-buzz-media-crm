// Google Ads API over plain REST + fetch (no client library). One set of
// agency credentials (an MCC/manager account's refresh token) reads every
// client account linked under that manager.
//
// Required env:  GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID,
//                GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN
// Optional env:  GOOGLE_ADS_LOGIN_CUSTOMER_ID (the MCC id — needed whenever
//                the accounts are reached through a manager account),
//                GOOGLE_ADS_API_VERSION (Google retires each version after
//                about a year — bump this when their deprecation emails arrive).

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v23";
const API_BASE = `https://googleads.googleapis.com/${API_VERSION}`;

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

export const isGoogleAdsConfigured = () =>
  Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN
  );

// Access tokens last an hour; reuse one until shortly before it expires.
let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // "invalid_grant" almost always means the refresh token was revoked or
    // expired (consent screen still in "Testing" mode expires it in 7 days).
    throw new Error(`Google OAuth failed: ${data.error_description || data.error || res.status}`);
  }
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

async function buildHeaders() {
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    "Content-Type": "application/json",
  };
  const loginCustomerId = digitsOnly(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

// Google nests the useful message a few levels deep in error.details.
function describeError(data, status) {
  const detail = data?.error?.details?.[0]?.errors?.[0];
  if (detail?.message) return `Google Ads API: ${detail.message}`;
  return `Google Ads API: ${data?.error?.message || `HTTP ${status}`}`;
}

// Runs one GAQL query against a customer, following every result page.
export async function searchGaql(customerId, query) {
  const rows = [];
  let pageToken;
  do {
    const res = await fetch(`${API_BASE}/customers/${digitsOnly(customerId)}/googleAds:search`, {
      method: "POST",
      headers: await buildHeaders(),
      body: JSON.stringify(pageToken ? { query, pageToken } : { query }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(describeError(data, res.status));
    rows.push(...(data.results || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return rows;
}

// Every non-manager account the credentials can read.
// → [{ externalAccountId, name, currency, timezone, status }]
export async function listGoogleAdsAccounts() {
  const managerId = digitsOnly(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

  if (managerId) {
    const rows = await searchGaql(
      managerId,
      `SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code,
              customer_client.time_zone, customer_client.status, customer_client.manager
       FROM customer_client
       WHERE customer_client.manager = FALSE`
    );
    return rows.map(({ customerClient: c }) => ({
      externalAccountId: String(c.id),
      name: c.descriptiveName || null,
      currency: c.currencyCode || null,
      timezone: c.timeZone || null,
      status: c.status || null,
    }));
  }

  // No manager account configured — fall back to the accounts the signed-in
  // Google user has direct access to.
  const res = await fetch(`${API_BASE}/customers:listAccessibleCustomers`, { headers: await buildHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(describeError(data, res.status));

  const accounts = [];
  for (const resourceName of data.resourceNames || []) {
    const customerId = resourceName.split("/")[1];
    const [row] = await searchGaql(
      customerId,
      "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.status, customer.manager FROM customer"
    );
    const c = row?.customer;
    if (!c || c.manager) continue;
    accounts.push({
      externalAccountId: String(c.id),
      name: c.descriptiveName || null,
      currency: c.currencyCode || null,
      timezone: c.timeZone || null,
      status: c.status || null,
    });
  }
  return accounts;
}

// Micros (millionths of the currency unit) → minor units (paise/cents).
const microsToMinor = (micros) => Math.round(Number(micros || 0) / 10_000);

// → [{ externalCampaignId, name, status, objective, dailyBudgetMinor, raw }]
export async function fetchGoogleAdsCampaigns(customerId) {
  const rows = await searchGaql(
    customerId,
    `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
            campaign_budget.amount_micros
     FROM campaign
     WHERE campaign.status != 'REMOVED'`
  );
  return rows.map((r) => ({
    externalCampaignId: String(r.campaign.id),
    name: r.campaign.name || null,
    status: r.campaign.status || null,
    objective: r.campaign.advertisingChannelType || null,
    dailyBudgetMinor: r.campaignBudget?.amountMicros != null ? microsToMinor(r.campaignBudget.amountMicros) : null,
    lifetimeBudgetMinor: null,
    startDate: null,
    endDate: null,
    raw: r,
  }));
}

// Per-campaign, per-day metrics for an inclusive YYYY-MM-DD range.
// Proto3 JSON leaves zero values out, hence the `|| 0` everywhere.
export async function fetchGoogleAdsDailyMetrics(customerId, since, until) {
  const rows = await searchGaql(
    customerId,
    `SELECT campaign.id, segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros,
            metrics.conversions, metrics.conversions_value
     FROM campaign
     WHERE segments.date BETWEEN '${since}' AND '${until}'`
  );
  return rows.map((r) => ({
    externalId: String(r.campaign.id),
    date: r.segments.date,
    impressions: Number(r.metrics?.impressions || 0),
    clicks: Number(r.metrics?.clicks || 0),
    spendMinor: microsToMinor(r.metrics?.costMicros),
    reach: null,
    conversions: Number(r.metrics?.conversions || 0),
    conversionValueMinor: Math.round(Number(r.metrics?.conversionsValue || 0) * 100),
    // Google has no separate "lead" metric — lead form submissions are
    // counted from ad_leads (the lead form webhook) instead.
    leads: 0,
    extra: null,
  }));
}
