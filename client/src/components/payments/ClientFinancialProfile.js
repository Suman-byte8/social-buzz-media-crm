"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchClientPaymentDetail } from "@/services/paymentService";
import { formatRupees } from "@/lib/formatCurrency";

const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const METHOD_LABEL = { upi: "UPI", bank_transfer: "Bank Transfer", cash: "Cash", cheque: "Cheque", razorpay: "Razorpay", other: "Other" };
const FREQ_LABEL = { monthly: "/mo", quarterly: "/qtr", half_yearly: "/6mo", yearly: "/yr", one_time: "" };

const STATUS_CHIP = {
  paid: "bg-emerald-50 text-emerald-700",
  partially_paid: "bg-amber-50 text-amber-700",
  issued: "bg-blue-50 text-blue-700",
  overdue: "bg-red-50 text-red-700",
  draft: "bg-slate-100 text-slate-600",
  void: "bg-slate-100 text-slate-500 line-through",
  cleared: "bg-emerald-50 text-emerald-700",
  advance: "bg-indigo-50 text-indigo-700",
  reversed: "bg-slate-100 text-slate-500 line-through",
};

function Chip({ kind, children }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CHIP[kind] || STATUS_CHIP.draft}`}>{children}</span>;
}

export function KpiCard({ label, value, sub, icon, tone = "default" }) {
  const tones = {
    default: "bg-white border-outline-variant",
    danger: "bg-red-50/60 border-red-200",
    accent: "bg-indigo-50/60 border-indigo-200",
  };
  const valueTone = tone === "danger" ? "text-red-700" : tone === "accent" ? "text-indigo-700" : "text-on-surface";
  return (
    <div className={`rounded-xl border p-4 shadow-card ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
        {icon && <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueTone}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function Panel({ title, icon, right, children, className = "" }) {
  return (
    <section className={`bg-white rounded-xl border border-outline-variant shadow-card ${className}`}>
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

export default function ClientFinancialProfile({ clientId, reloadKey, onClose, onOpenDrawer, onRecordPayment }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showAllLedger, setShowAllLedger] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setData(null);
      setError(null);
    });
    fetchClientPaymentDetail(clientId)
      .then((res) => !cancelled && setData(res.data))
      .catch((e) => !cancelled && setError(e.message || "Failed to load client"));
    return () => {
      cancelled = true;
    };
  }, [clientId, reloadKey]);

  const derived = useMemo(() => {
    if (!data) return null;
    const invoices = data.invoices || [];
    const payments = data.payments || [];
    const live = invoices.filter((i) => i.status !== "void" && i.status !== "draft");

    // Ledger: invoices are debits, confirmed payments credits. Balance > 0 = client owes (Dr), < 0 = advance (Cr).
    const entries = [
      ...live.map((i) => ({ key: `i${i.id}`, date: i.invoiceDate, ref: i.invoiceNumber, kind: "invoice", desc: (i.lineItems || []).map((l) => l.description).join(", ") || "Invoice", sub: `Due ${fmtDate(i.dueDate)}`, debit: i.totalPaise, credit: 0, status: i.status })),
      ...payments.filter((p) => p.status === "confirmed").map((p) => ({ key: `p${p.id}`, date: p.paymentDate, ref: p.referenceNumber || `PMT-${p.id}`, kind: "payment", desc: `Payment received via ${METHOD_LABEL[p.method] || p.method}`, sub: p.notes || "", debit: 0, credit: p.amountPaise, status: "cleared" })),
    ].sort((a, b) => (a.date === b.date ? (a.kind === "invoice" ? -1 : 1) : a.date < b.date ? -1 : 1));
    let bal = 0;
    for (const e of entries) {
      bal += e.debit - e.credit;
      e.balance = bal;
    }
    const ledger = entries.reverse();

    const planItems = data.client?.billingConfig?.planItems || [];
    const recurringPaise = planItems.filter((p) => !p.isOneTime).reduce((s, p) => s + p.amountPaise, 0);
    const onTime = live.filter((i) => i.status === "paid").length;

    return { ledger, planItems, recurringPaise, invoiceCount: live.length, paymentCount: payments.length, onTime };
  }, [data]);

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 mb-6 flex items-center justify-between">
        <p className="text-red-700 text-sm">{error}</p>
        <button onClick={onClose} className="text-sm underline">Back to all clients</button>
      </div>
    );
  }

  if (!data || !derived) {
    return <div className="bg-white rounded-xl border border-outline-variant p-10 mb-6 text-center text-on-surface-variant text-sm animate-pulse">Loading client financial profile…</div>;
  }

  const { client, summary } = data;
  const config = client.billingConfig;
  const taxPct = config ? (config.taxRateBasisPoints || 0) / 100 : 0;
  const billed = summary.totalBilled || 0;
  const collected = summary.totalCollected || 0;
  const realizedPct = billed ? Math.min(100, Math.round((Math.min(collected, billed) / billed) * 1000) / 10) : 0;
  // Kept deliberately simple: Due = Invoiced − Received (never below zero).
  const due = Math.max(billed - collected, 0);
  const advance = Math.max(collected - billed, 0);
  const ledgerRows = showAllLedger ? derived.ledger : derived.ledger.slice(0, 6);
  const initials = (client.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mb-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-14 w-14 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">{initials}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-on-surface truncate">{client.legalName || client.name}</h2>
              {client.industry && <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">{client.industry}</span>}
              {config && <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${config.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>Billing {config.status}</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
              {client.gstin && <span>GSTIN: <b className="text-on-surface">{client.gstin}</b></span>}
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
              {summary.lastPaymentDate && <span>Last payment: {fmtDate(summary.lastPaymentDate)}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onOpenDrawer({ initialTab: "Invoices", autoAddInvoice: true })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">add</span>Create Invoice
          </button>
          <button onClick={onRecordPayment} className="px-3 py-2 bg-primary text-on-primary rounded-lg text-sm hover:opacity-90 flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">payments</span>Record Payment
          </button>
          <button onClick={() => onOpenDrawer({ initialTab: "Reminders" })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">notifications</span>Remind
          </button>
          <button onClick={() => onOpenDrawer({})} className="px-3 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">tune</span>Manage
          </button>
          <button onClick={onClose} title="Back to all clients" className="px-3 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Client KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Invoiced" icon="receipt_long" value={formatRupees(billed)} sub={`${derived.invoiceCount} invoice${derived.invoiceCount === 1 ? "" : "s"}`} />
        <KpiCard label="Received" icon="check_circle" value={formatRupees(collected)} sub={`${derived.paymentCount} payment${derived.paymentCount === 1 ? "" : "s"}`} />
        <KpiCard label="Due" icon="error" tone={due > 0 ? "danger" : "default"} value={formatRupees(due)} sub="Invoiced − Received" />
        <KpiCard label="Advance Paid" icon="account_balance_wallet" tone={advance > 0 ? "accent" : "default"} value={formatRupees(advance)} sub="Received − Invoiced" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Panel title="Payment Progress" icon="sync_alt" right={<span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">{realizedPct}% received</span>}>
            <div className="h-3 w-full rounded-full bg-red-200 overflow-hidden flex">
              <div className="h-full bg-indigo-600" style={{ width: `${realizedPct}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[12px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-600" />Received: <b>{formatRupees(collected)}</b></span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-300" />Due: <b>{formatRupees(due)}</b></span>
            </div>
          </Panel>

          <Panel
            title="Statement of Account"
            icon="list_alt"
            right={
              derived.ledger.length > 6 && (
                <button onClick={() => setShowAllLedger((v) => !v)} className="text-[12px] text-primary hover:underline">
                  {showAllLedger ? "Show recent" : `View all ${derived.ledger.length}`}
                </button>
              )
            }
          >
            {derived.ledger.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">No issued invoices or payments yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-on-surface-variant border-b border-outline-variant">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-2 py-2">Ref</th>
                      <th className="px-2 py-2">Description</th>
                      <th className="px-2 py-2 text-right">Debit</th>
                      <th className="px-2 py-2 text-right">Credit</th>
                      <th className="px-2 py-2 text-right">Balance</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.map((e) => (
                      <tr key={e.key} className="border-b border-outline-variant/60 last:border-0 hover:bg-surface-variant/40">
                        <td className="px-4 py-2 whitespace-nowrap text-on-surface-variant">{fmtDate(e.date)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <span className="material-symbols-outlined text-[16px]">{e.kind === "invoice" ? "description" : "task_alt"}</span>
                            {e.ref}
                          </span>
                        </td>
                        <td className="px-2 py-2 max-w-[260px]">
                          <p className="truncate font-medium text-on-surface">{e.desc}</p>
                          {e.sub && <p className="truncate text-[11px] text-on-surface-variant">{e.sub}</p>}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">{e.debit ? formatRupees(e.debit) : "–"}</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap text-emerald-700">{e.credit ? formatRupees(e.credit) : "–"}</td>
                        <td className={`px-2 py-2 text-right whitespace-nowrap font-semibold ${e.balance > 0 ? "text-red-700" : e.balance < 0 ? "text-indigo-700" : ""}`}>
                          {formatRupees(Math.abs(e.balance))} {e.balance > 0 ? "Dr" : e.balance < 0 ? "Cr" : ""}
                        </td>
                        <td className="px-4 py-2"><Chip kind={e.status}>{e.status.replace("_", " ")}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

        </div>

        <div className="space-y-4">
          <Panel title="Active Service Package" icon="inventory_2" right={<span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100">{derived.planItems.length} lines</span>}>
            {derived.planItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-on-surface-variant">No services configured.</p>
                <button onClick={() => onOpenDrawer({ initialTab: "Billing Config" })} className="mt-2 text-[12px] text-primary hover:underline">Set up billing</button>
              </div>
            ) : (
              <div className="space-y-2">
                {derived.planItems.map((p) => (
                  <div key={p.id} className="rounded-lg border border-outline-variant p-3">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold text-sm text-on-surface">{p.serviceName}</p>
                      <p className="font-semibold text-sm whitespace-nowrap">{formatRupees(p.amountPaise)}<span className="text-[11px] text-on-surface-variant font-normal">{p.isOneTime ? " once" : FREQ_LABEL[config?.billingFrequency] || ""}</span></p>
                    </div>
                    {p.description && <p className="text-[12px] text-on-surface-variant mt-0.5">{p.description}</p>}
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="text-on-surface-variant">Combined recurring billing</span>
                  <b>{formatRupees(derived.recurringPaise)}{taxPct ? <span className="text-[11px] font-normal text-on-surface-variant"> + GST</span> : null}</b>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Payment Reliability" icon="verified_user" right={derived.invoiceCount ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{Math.round((derived.onTime / derived.invoiceCount) * 100)}% settled</span> : null}>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-on-surface-variant">Billing frequency</dt><dd className="font-medium capitalize">{config?.billingFrequency?.replace("_", " ") || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Payment terms</dt><dd className="font-medium">{config ? `Net ${config.dueInDays} days` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">GST rate</dt><dd className="font-medium">{config ? `${taxPct}%` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Invoices fully paid</dt><dd className="font-medium">{derived.onTime} / {derived.invoiceCount}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Pending reminders</dt><dd className="font-medium">{(data.reminders || []).length}</dd></div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
