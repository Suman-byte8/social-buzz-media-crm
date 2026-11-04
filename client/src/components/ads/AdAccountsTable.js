"use client";

import React from "react";

const PLATFORM_LABEL = { google_ads: "Google Ads", meta: "Meta" };
const PLATFORM_ICON = { google_ads: "ads_click", meta: "campaign" };
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never");

// Every ad account the API credentials can see, with the two settings the
// CRM owns: which client it belongs to, and whether to keep syncing it.
export default function AdAccountsTable({ accounts, clients, savingId, onChange }) {
  if (accounts.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-on-surface-variant">
        No ad accounts yet. Add the API credentials on the server, then press <strong>Sync now</strong> to discover them.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -m-4">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-outline-variant text-[11px] uppercase tracking-wide text-on-surface-variant">
            <th className="py-2.5 px-4 font-semibold">Account</th>
            <th className="py-2.5 px-3 font-semibold">Status</th>
            <th className="py-2.5 px-3 font-semibold">Linked client</th>
            <th className="py-2.5 px-3 font-semibold text-center">Sync</th>
            <th className="py-2.5 px-4 font-semibold">Last synced</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F0]">
          {accounts.map((a) => (
            <tr key={a.id} className={`hover:bg-[#F9F9F9] ${savingId === a.id ? "opacity-60" : ""}`}>
              <td className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary" title={PLATFORM_LABEL[a.platform]}>{PLATFORM_ICON[a.platform]}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface truncate">{a.name || "Unnamed account"}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {PLATFORM_LABEL[a.platform]} · {a.externalAccountId} · {a.currency || "—"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-2.5 px-3 text-xs text-on-surface-variant">{(a.status || "—").replace(/_/g, " ").toLowerCase()}</td>
              <td className="py-2.5 px-3">
                <select
                  value={a.clientId ?? ""}
                  disabled={savingId === a.id}
                  onChange={(e) => onChange(a, { clientId: e.target.value === "" ? null : Number(e.target.value) })}
                  className={`w-full min-w-[180px] px-2 py-1.5 border rounded-lg bg-white text-sm ${a.clientId ? "border-outline-variant text-on-surface" : "border-amber-300 text-amber-800"}`}
                >
                  <option value="">— Not linked —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </td>
              <td className="py-2.5 px-3 text-center">
                <input
                  type="checkbox"
                  checked={a.syncEnabled}
                  disabled={savingId === a.id}
                  onChange={(e) => onChange(a, { syncEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                  title={a.syncEnabled ? "Synced on every run" : "Skipped by the sync"}
                />
              </td>
              <td className="py-2.5 px-4 text-xs">
                <p className="text-on-surface">{fmtDateTime(a.lastSyncedAt)}</p>
                {a.lastSyncError && (
                  <p className="text-red-600 max-w-[280px] truncate" title={a.lastSyncError}>{a.lastSyncError}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
