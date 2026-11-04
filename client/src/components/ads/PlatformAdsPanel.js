"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchClientAdsSummary } from "@/services/adsService";
import { KpiCard } from "@/components/payments/ClientFinancialProfile";
import { formatMoney } from "@/lib/formatCurrency";
import { useAuth } from "@/app/login/context/AuthContext";

const PLATFORM = {
  google_ads: { title: "Google Ads", icon: "ads_click", resultLabel: "Conversions" },
  meta: { title: "Meta Ads", icon: "campaign", resultLabel: "Leads" },
};

const RANGE_OPTIONS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
];

const STATUS_CHIP = {
  ENABLED: "bg-emerald-50 text-emerald-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  CAMPAIGN_PAUSED: "bg-amber-50 text-amber-700",
};

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function rangeFor(preset) {
  const today = new Date();
  if (preset === "this_month") return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
  if (preset === "last_month") {
    return { from: iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: iso(new Date(today.getFullYear(), today.getMonth(), 0)) };
  }
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: iso(from), to: iso(today) };
}

// Every date in [from, to], so days with no spend still get a (zero) bar.
function eachDay(from, to) {
  const out = [];
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    out.push(iso(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const num = (n) => Math.round(n || 0).toLocaleString("en-IN");
const pct = (part, whole) => (whole > 0 ? `${((part / whole) * 100).toFixed(2)}%` : "—");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "never");

function Panel({ title, icon, right, children }) {
  return (
    <section className="bg-white rounded-xl border border-outline-variant shadow-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <h3 className="flex items-center gap-2 font-semibold text-on-surface text-sm">
          {icon && <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>}
          {title}
        </h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DailySpendChart({ daily, from, to, currency }) {
  const days = useMemo(() => {
    const byDate = new Map(daily.filter((d) => d.currency === currency).map((d) => [d.date, d]));
    return eachDay(from, to).map((date) => byDate.get(date) || { date, spendMinor: 0, clicks: 0, leads: 0, conversions: 0 });
  }, [daily, from, to, currency]);
  const max = Math.max(...days.map((d) => d.spendMinor), 1);

  return (
    <div>
      <div className="flex items-end gap-[2px] h-40">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${fmtDate(d.date)} — ${formatMoney(d.spendMinor, currency)} · ${num(d.clicks)} clicks · ${num(d.leads)} leads`}
            className="flex-1 bg-primary/70 hover:bg-primary rounded-t-sm transition-colors min-h-[2px]"
            style={{ height: `${Math.max((d.spendMinor / max) * 100, d.spendMinor > 0 ? 2 : 1)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-on-surface-variant">
        <span>{fmtDate(from)}</span>
        <span>Peak {formatMoney(max === 1 ? 0 : max, currency)} / day</span>
        <span>{fmtDate(to)}</span>
      </div>
    </div>
  );
}

// Body of a client's "Google Ads" / "Meta Ads" tab: live numbers synced
// from the platform for every ad account linked to this client.
export default function PlatformAdsPanel({ client, platform }) {
  const { isAdmin } = useAuth();
  const meta = PLATFORM[platform];
  const clientId = client?.id;
  const [preset, setPreset] = useState("30d");
  const [reloadNonce, setReloadNonce] = useState(0);
  const { from, to } = useMemo(() => rangeFor(preset), [preset]);

  // Loading is derived from whether the stored result matches the current
  // request, so the effect never sets state synchronously.
  const requestKey = `${clientId}|${platform}|${from}|${to}|${reloadNonce}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const loading = result.key !== requestKey;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    fetchClientAdsSummary(clientId, { platform, from, to })
      .then((res) => !cancelled && setResult({ key: requestKey, data: res.data, error: null }))
      .catch((err) => !cancelled && setResult({ key: requestKey, data: null, error: err.message || "Could not load ads data" }));
    return () => {
      cancelled = true;
    };
  }, [clientId, platform, from, to, requestKey]);

  const data = result.data;
  const primary = data?.totals?.[0] || null;
  const currency = primary?.currency || data?.accounts?.[0]?.currency || "INR";
  const leads = platform === "meta" ? primary?.leads || 0 : data?.formLeads || 0;
  const results = platform === "meta" ? leads : primary?.conversions || 0;
  const legacyCampaigns = Array.isArray(client?.campaigns) ? client.campaigns : client?.campaigns ? String(client.campaigns).split(",").filter(Boolean) : [];

  const header = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">{meta.icon}</span>
          {meta.title}
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          {data?.accounts?.length
            ? `${data.accounts.map((a) => a.name || a.externalAccountId).join(", ")} · last synced ${fmtDateTime(data.accounts[0].lastSyncedAt)}`
            : `Live campaign performance for ${client?.name || "this client"}.`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-white text-sm text-on-surface"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => setReloadNonce((n) => n + 1)}
          disabled={loading}
          title="Reload from the CRM (data itself refreshes every 6 hours, or via Sync now on the Ad Accounts page)"
          className="px-3 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant transition-colors flex items-center disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
        </button>
      </div>
    </div>
  );

  if (loading && !data) {
    return (
      <main className="flex-1 flex flex-col gap-4">
        {header}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-variant/40 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (result.error) {
    return (
      <main className="flex-1 flex flex-col gap-4">
        {header}
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">{result.error}</div>
      </main>
    );
  }

  if (!data?.accounts?.length) {
    return (
      <main className="flex-1 flex flex-col gap-4">
        {header}
        <div className="p-6 rounded-xl border border-dashed border-outline-variant bg-white text-center">
          <span className="material-symbols-outlined text-[36px] text-on-surface-variant">link_off</span>
          <p className="mt-2 font-semibold text-on-surface">No {meta.title} account linked to {client?.name || "this client"}</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {!data?.configured
              ? `${meta.title} API credentials haven't been added to the server yet.`
              : `Link this client's ad account once and its numbers sync automatically.`}
          </p>
          {isAdmin && (
            <Link href="/ads" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">
              <span className="material-symbols-outlined text-[18px]">add_link</span>
              Manage ad accounts
            </Link>
          )}
        </div>
        {legacyCampaigns.length > 0 && (
          <Panel title="Recorded campaigns" icon="list">
            <ul className="text-sm text-on-surface divide-y divide-[#F0F0F0]">
              {legacyCampaigns.map((c, i) => (
                <li key={i} className="py-2">{typeof c === "object" ? c.name : c}</li>
              ))}
            </ul>
          </Panel>
        )}
      </main>
    );
  }

  return (
    <main className={`flex-1 flex flex-col gap-4 ${loading ? "opacity-70" : ""}`}>
      {header}

      {data.accounts.some((a) => a.lastSyncError) && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          Last sync had a problem: {data.accounts.find((a) => a.lastSyncError).lastSyncError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Spend" value={formatMoney(primary?.spendMinor, currency)} icon="payments" />
        <KpiCard label="Impressions" value={num(primary?.impressions)} icon="visibility" />
        <KpiCard label="Clicks" value={num(primary?.clicks)} icon="ads_click" />
        <KpiCard label="CTR" value={pct(primary?.clicks, primary?.impressions)} icon="percent" />
        <KpiCard label="Avg. CPC" value={primary?.clicks ? formatMoney(primary.spendMinor / primary.clicks, currency) : "—"} icon="touch_app" />
        <KpiCard label="Conversions" value={num(primary?.conversions)} icon="flag" sub={platform === "meta" ? "Leads + purchases" : null} />
        <KpiCard label="Leads" value={num(leads)} icon="person_add" tone="accent" sub={platform === "google_ads" ? "Lead form submissions" : null} />
        <KpiCard
          label={`Cost / ${platform === "meta" ? "lead" : "conversion"}`}
          value={results > 0 ? formatMoney((primary?.spendMinor || 0) / results, currency) : "—"}
          icon="price_check"
        />
      </div>

      {data.totals.length > 1 && (
        <p className="text-xs text-on-surface-variant">
          Also spent {data.totals.slice(1).map((t) => formatMoney(t.spendMinor, t.currency)).join(", ")} in other currencies (not included above).
        </p>
      )}

      <Panel title={`Daily spend (${currency})`} icon="bar_chart">
        <DailySpendChart daily={data.daily} from={data.from} to={data.to} currency={currency} />
      </Panel>

      <Panel title="Campaigns" icon="campaign" right={<span className="text-xs text-on-surface-variant">{data.campaigns.length} shown</span>}>
        <div className="overflow-x-auto -m-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-outline-variant text-[11px] uppercase tracking-wide text-on-surface-variant">
                <th className="py-2.5 px-4 font-semibold">Campaign</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Spend</th>
                <th className="py-2.5 px-3 font-semibold text-right">Impr.</th>
                <th className="py-2.5 px-3 font-semibold text-right">Clicks</th>
                <th className="py-2.5 px-3 font-semibold text-right">CTR</th>
                <th className="py-2.5 px-3 font-semibold text-right">CPC</th>
                <th className="py-2.5 px-3 font-semibold text-right">{meta.resultLabel}</th>
                <th className="py-2.5 px-4 font-semibold text-right">Budget / day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {data.campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-on-surface-variant">No campaign activity in this period.</td>
                </tr>
              ) : (
                data.campaigns.map((c) => {
                  const campaignResults = platform === "meta" ? c.leads : c.conversions;
                  return (
                    <tr key={`${c.accountName}-${c.externalCampaignId}`} className="hover:bg-[#F9F9F9]">
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-on-surface">{c.name || `Campaign ${c.externalCampaignId}`}</p>
                        <p className="text-[11px] text-on-surface-variant">{[c.objective, data.accounts.length > 1 ? c.accountName : null].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CHIP[c.status] || "bg-slate-100 text-slate-600"}`}>
                          {(c.status || "—").replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatMoney(c.spendMinor, c.currency)}</td>
                      <td className="py-2.5 px-3 text-right">{num(c.impressions)}</td>
                      <td className="py-2.5 px-3 text-right">{num(c.clicks)}</td>
                      <td className="py-2.5 px-3 text-right">{pct(c.clicks, c.impressions)}</td>
                      <td className="py-2.5 px-3 text-right">{c.clicks ? formatMoney(c.spendMinor / c.clicks, c.currency) : "—"}</td>
                      <td className="py-2.5 px-3 text-right">{campaignResults ? num(campaignResults) : "—"}</td>
                      <td className="py-2.5 px-4 text-right">{c.dailyBudgetMinor != null ? formatMoney(c.dailyBudgetMinor, c.currency) : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {data.recentLeads.length > 0 && (
        <Panel
          title="Recent leads from ads"
          icon="person_add"
          right={<Link href="/leads" className="text-xs text-primary hover:underline">Open Leads</Link>}
        >
          <ul className="divide-y divide-[#F0F0F0] text-sm">
            {data.recentLeads.map((l) => (
              <li key={l.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-on-surface truncate">
                    {l.fullName || l.email || "Unnamed lead"}
                    {l.isTest && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">test</span>}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">{[l.email, l.phone, l.campaignName || l.formName].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="text-[11px] text-on-surface-variant shrink-0">{fmtDateTime(l.leadCreatedAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </main>
  );
}
