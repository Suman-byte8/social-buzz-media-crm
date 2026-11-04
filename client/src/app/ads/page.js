"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAdmin from "@/components/auth/RequireAdmin";
import AdAccountsTable from "@/components/ads/AdAccountsTable";
import { KpiCard } from "@/components/payments/ClientFinancialProfile";
import { fetchAdsStatus, fetchAdsOverview, fetchAdAccounts, updateAdAccount, syncAdsNow, subscribeMetaPages } from "@/services/adsService";
import { fetchClients } from "@/services/clientService";
import { formatMoney } from "@/lib/formatCurrency";

const PLATFORMS = [
  { id: "google_ads", label: "Google Ads", icon: "ads_click", envVars: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_LOGIN_CUSTOMER_ID"] },
  { id: "meta", label: "Meta Ads", icon: "campaign", envVars: ["META_SYSTEM_USER_TOKEN", "META_APP_SECRET"] },
];
const PLATFORM_LABEL = { google_ads: "Google Ads", meta: "Meta" };
const SYNC_CHIP = {
  ok: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  running: "bg-blue-50 text-blue-700",
};

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never");
const num = (n) => Math.round(n || 0).toLocaleString("en-IN");

function Panel({ title, icon, right, children }) {
  return (
    <section className="bg-white rounded-xl border border-outline-variant shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-outline-variant">
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

function PlatformStatusCard({ platform, status }) {
  const last = status?.lastSync;
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-on-surface">
          <span className="material-symbols-outlined text-primary">{platform.icon}</span>
          {platform.label}
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${status?.configured ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {status?.configured ? "Connected" : "Not configured"}
        </span>
      </div>
      {status?.configured ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-on-surface">{status.accountCount}</p>
            <p className="text-[11px] text-on-surface-variant">Accounts</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${status.linkedCount < status.accountCount ? "text-amber-700" : "text-on-surface"}`}>{status.linkedCount}</p>
            <p className="text-[11px] text-on-surface-variant">Linked</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface mt-1">{fmtDateTime(last?.finishedAt || last?.startedAt)}</p>
            <p className="text-[11px] text-on-surface-variant">
              Last sync{" "}
              {last && <span className={`px-1.5 rounded ${SYNC_CHIP[last.status] || ""}`}>{last.status}</span>}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-on-surface-variant">
          Set these on both Render services (and in <code>server/.env</code> locally), then redeploy:
          <div className="mt-2 flex flex-wrap gap-1">
            {platform.envVars.map((v) => (
              <code key={v} className="px-1.5 py-0.5 rounded bg-surface-variant/60 text-[11px] text-on-surface">{v}</code>
            ))}
          </div>
        </div>
      )}
      {last?.error && (
        <p className="mt-3 text-xs text-red-600 line-clamp-2" title={last.error}>{last.error}</p>
      )}
    </div>
  );
}

export default function AdAccountsPage() {
  // Bumping reloadKey refetches everything; loading is derived from whether
  // the stored result matches it, so the effect never sets state synchronously.
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: -1, status: null, overview: null, accounts: [], error: null });
  const loading = result.key !== reloadKey;
  const [clients, setClients] = useState([]);
  const [accountOverrides, setAccountOverrides] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [syncDays, setSyncDays] = useState("7");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeResult, setSubscribeResult] = useState(null);
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAdsStatus(), fetchAdsOverview(), fetchAdAccounts()])
      .then(([status, overview, accounts]) => {
        if (cancelled) return;
        setAccountOverrides({});
        setResult({ key: reloadKey, status: status.data, overview: overview.data, accounts: accounts.data || [], error: null });
      })
      .catch((err) => !cancelled && setResult((prev) => ({ ...prev, key: reloadKey, error: err.message || "Could not load ad accounts" })));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    fetchClients({ limit: 1000, sortBy: "name", sortOrder: "ASC" })
      .then((res) => setClients(res.data || []))
      .catch(() => setClients([]));
  }, []);

  const accounts = useMemo(
    () =>
      result.accounts
        .map((a) => ({ ...a, ...accountOverrides[a.id] }))
        .filter((a) => platformFilter === "all" || a.platform === platformFilter),
    [result.accounts, accountOverrides, platformFilter]
  );

  const handleAccountChange = async (account, changes) => {
    setSavingId(account.id);
    setAccountOverrides((prev) => ({ ...prev, [account.id]: { ...prev[account.id], ...changes } }));
    try {
      const res = await updateAdAccount(account.id, changes);
      setAccountOverrides((prev) => ({ ...prev, [account.id]: res.data }));
    } catch (err) {
      setAccountOverrides((prev) => {
        const next = { ...prev };
        delete next[account.id];
        return next;
      });
      alert(err.message || "Could not update the ad account.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncAdsNow({ days: Number(syncDays) });
      const parts = (res.data || []).map((r) =>
        r.status === "skipped"
          ? `${PLATFORM_LABEL[r.platform]}: skipped (${r.message})`
          : `${PLATFORM_LABEL[r.platform]}: ${r.status} — ${r.accountsSynced} accounts, ${r.rowsUpserted} rows${r.leadsImported ? `, ${r.leadsImported} new leads` : ""}`
      );
      const hasErrors = (res.data || []).some((r) => r.status === "error" || r.status === "partial");
      setSyncMessage({ tone: hasErrors ? "warn" : "ok", text: parts.join(" · ") || "Nothing to sync." });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSyncMessage({ tone: "error", text: err.message || "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  const handleSubscribePages = async () => {
    setSubscribing(true);
    try {
      const res = await subscribeMetaPages();
      setSubscribeResult(res.data || []);
    } catch (err) {
      setSubscribeResult([{ name: "Error", subscribed: false, error: err.message }]);
    } finally {
      setSubscribing(false);
    }
  };

  const status = result.status;
  const overview = result.overview;
  const anyConfigured = status && Object.values(status.platforms).some((p) => p.configured);
  const unlinked = result.accounts.filter((a) => !(accountOverrides[a.id]?.clientId ?? a.clientId)).length;

  return (
    <RequireAdmin>
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Ad Accounts</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Google Ads and Meta performance, synced every 6 hours and shown on each client&apos;s Google Ads / Meta Ads tab.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={syncDays}
              onChange={(e) => setSyncDays(e.target.value)}
              disabled={syncing}
              className="px-3 py-2 border border-outline-variant rounded-lg bg-white text-sm text-on-surface"
              title="How many days back to re-pull"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={handleSync}
              disabled={syncing || !anyConfigured}
              title={anyConfigured ? "Pull the latest numbers now" : "Add API credentials on the server first"}
              className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${syncing ? "animate-spin" : ""}`}>sync</span>
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          </div>
        </div>

        {syncMessage && (
          <div
            className={`p-3 rounded-lg border text-sm ${
              syncMessage.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : syncMessage.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {syncMessage.text}
          </div>
        )}

        {result.error && <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{result.error}</div>}

        {loading && !status ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-surface-variant/40 animate-pulse" />
            ))}
          </div>
        ) : (
          status && (
            <div className="grid md:grid-cols-2 gap-4">
              {PLATFORMS.map((p) => (
                <PlatformStatusCard key={p.id} platform={p} status={status.platforms[p.id]} />
              ))}
            </div>
          )
        )}

        {overview?.totals?.length > 0 && (
          <Panel title="Last 30 days, all clients" icon="insights">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {overview.totals.map((t) => (
                <React.Fragment key={`${t.platform}-${t.currency}`}>
                  <KpiCard label={`${PLATFORM_LABEL[t.platform]} spend`} value={formatMoney(t.spendMinor, t.currency)} icon="payments" sub={t.currency} />
                  <KpiCard label={`${PLATFORM_LABEL[t.platform]} clicks`} value={num(t.clicks)} icon="ads_click" sub={`${num(t.impressions)} impressions`} />
                </React.Fragment>
              ))}
            </div>
            {overview.byClient.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant text-[11px] uppercase tracking-wide text-on-surface-variant">
                      <th className="py-2 pr-3 font-semibold">Client</th>
                      <th className="py-2 px-3 font-semibold">Platform</th>
                      <th className="py-2 px-3 font-semibold text-right">Spend</th>
                      <th className="py-2 px-3 font-semibold text-right">Clicks</th>
                      <th className="py-2 px-3 font-semibold text-right">Conversions</th>
                      <th className="py-2 pl-3 font-semibold text-right">Leads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {overview.byClient.slice(0, 15).map((row) => (
                      <tr key={`${row.platform}-${row.currency}-${row.clientId}`}>
                        <td className="py-2 pr-3">
                          {row.clientId ? (
                            <Link href={`/clients/${row.clientId}`} className="font-medium text-on-surface hover:text-primary">{row.clientName}</Link>
                          ) : (
                            <span className="text-amber-700">Unlinked accounts</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-on-surface-variant">{PLATFORM_LABEL[row.platform]}</td>
                        <td className="py-2 px-3 text-right font-medium">{formatMoney(row.spendMinor, row.currency)}</td>
                        <td className="py-2 px-3 text-right">{num(row.clicks)}</td>
                        <td className="py-2 px-3 text-right">{num(row.conversions)}</td>
                        <td className="py-2 pl-3 text-right">{num(row.leads)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        <Panel
          title="Accounts"
          icon="account_tree"
          right={
            <div className="flex items-center gap-3">
              {unlinked > 0 && <span className="text-xs text-amber-700">{unlinked} not linked to a client</span>}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-2 py-1 border border-outline-variant rounded-lg bg-white text-xs text-on-surface"
              >
                <option value="all">All platforms</option>
                <option value="google_ads">Google Ads</option>
                <option value="meta">Meta</option>
              </select>
            </div>
          }
        >
          <AdAccountsTable accounts={accounts} clients={clients} savingId={savingId} onChange={handleAccountChange} />
        </Panel>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Lead capture" icon="person_add">
            <div className="space-y-4 text-sm text-on-surface-variant">
              <div>
                <p className="font-semibold text-on-surface">Meta Lead Ads</p>
                <p className="mt-1">
                  New leads are pulled from every lead form on each sync and added to the Leads page. For instant delivery, configure the
                  webhook in your Meta app, then subscribe your Pages.
                </p>
                <button
                  onClick={handleSubscribePages}
                  disabled={subscribing || !status?.platforms?.meta?.configured}
                  className="mt-2 px-3 py-1.5 border border-outline-variant rounded-lg text-on-surface text-xs hover:bg-surface-variant disabled:opacity-60"
                >
                  {subscribing ? "Subscribing…" : "Subscribe Pages to instant leads"}
                </button>
                {subscribeResult && (
                  <ul className="mt-2 text-xs space-y-1">
                    {subscribeResult.length === 0 && <li>No Pages are assigned to the system user.</li>}
                    {subscribeResult.map((r, i) => (
                      <li key={r.pageId || i} className={r.subscribed ? "text-emerald-700" : "text-red-600"}>
                        {r.name}: {r.subscribed ? "subscribed" : r.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="font-semibold text-on-surface">Google Ads lead forms</p>
                <p className="mt-1">
                  In each lead form asset, set the webhook URL to <code className="text-[11px]">…/api/ads/webhooks/google-leads</code> and the key to
                  your <code className="text-[11px]">GOOGLE_ADS_LEAD_WEBHOOK_KEY</code>.{" "}
                  {status && !status.webhooks.googleLeadsKeySet && <span className="text-amber-700">(Key not set on the server yet.)</span>}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Recent syncs" icon="history">
            {!status?.recentLogs?.length ? (
              <p className="text-sm text-on-surface-variant">No syncs have run yet.</p>
            ) : (
              <ul className="divide-y divide-[#F0F0F0] text-xs">
                {status.recentLogs.map((log) => (
                  <li key={log.id} className="py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-on-surface">
                        <span className={`px-1.5 py-0.5 rounded mr-2 ${SYNC_CHIP[log.status] || ""}`}>{log.status}</span>
                        {PLATFORM_LABEL[log.platform]} · {log.trigger} · {log.accountsSynced} accounts · {log.rowsUpserted} rows
                        {log.leadsImported ? ` · ${log.leadsImported} leads` : ""}
                      </p>
                      {log.error && <p className="text-red-600 mt-0.5 truncate" title={log.error}>{log.error}</p>}
                    </div>
                    <span className="text-on-surface-variant shrink-0">{fmtDateTime(log.startedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </main>
    </RequireAdmin>
  );
}
