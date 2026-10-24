"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClientPaymentDetail, clearClientDetail, invalidatePaymentsCaches } from "@/redux/slices/paymentsSlice";
import { voidInvoice, duplicateInvoice, reversePayment, applyAdvance, exportInvoicePdf, exportReceiptPdf, fetchPaymentActivity, completeReminder } from "@/services/paymentService";
import { getNodesPdfBlob } from "@/lib/Pdfexport";
import { formatRupees } from "@/lib/formatCurrency";
import StatusBadge from "@/components/ui/StatusBadge";
import BillingConfigPanel from "./BillingConfigPanel";
import InvoiceFormModal from "./InvoiceFormModal";
import RecordPaymentModal from "./RecordPaymentModal";
import PaymentReminderComposer from "./PaymentReminderComposer";
import InvoiceDocument from "./InvoiceDocument";
import PaymentReceiptDocument from "./PaymentReceiptDocument";

const TABS = ["Overview", "Billing Config", "Invoices", "Payments", "Reminders", "Activity"];

const INVOICE_STATUS_META = {
  draft: "gray",
  issued: "blue",
  partially_paid: "amber",
  paid: "green",
  overdue: "red",
  void: "gray",
};

export default function ClientPaymentDrawer({ clientId, onClose }) {
  const dispatch = useDispatch();
  const { clientDetail, loadingClientDetail } = useSelector((s) => s.payments);
  const [tab, setTab] = useState("Overview");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [reminderInvoiceId, setReminderInvoiceId] = useState(null);
  const [activity, setActivity] = useState([]);
  const [exportTarget, setExportTarget] = useState(null); // { type: "invoice"|"receipt", data }
  const invoiceDocRef = useRef(null);
  const receiptDocRef = useRef(null);

  const reload = () => {
    dispatch(fetchClientPaymentDetail(clientId));
    invalidatePaymentsCaches();
  };

  useEffect(() => {
    if (clientId) reload();
    return () => dispatch(clearClientDetail());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (tab === "Activity" && clientId) {
      fetchPaymentActivity(clientId).then((res) => setActivity(res.data || []));
    }
  }, [tab, clientId]);

  const handleVoidInvoice = async (invoice) => {
    const reason = window.prompt("Reason for voiding this invoice:");
    if (!reason || !reason.trim()) return;
    try {
      await voidInvoice(invoice.id, reason.trim());
      reload();
    } catch (err) {
      window.alert(err.message || "Failed to void invoice");
    }
  };

  const handleDuplicateInvoice = async (invoice) => {
    try {
      await duplicateInvoice(invoice.id);
      reload();
    } catch (err) {
      window.alert(err.message || "Failed to duplicate invoice");
    }
  };

  const handleReversePayment = async (payment) => {
    const reason = window.prompt("Reason for reversing this payment:");
    if (!reason || !reason.trim()) return;
    try {
      await reversePayment(payment.id, reason.trim());
      reload();
    } catch (err) {
      window.alert(err.message || "Failed to reverse payment");
    }
  };

  const handleApplyAdvance = async (invoice) => {
    const remaining = invoice.totalPaise - invoice.amountPaidPaise;
    const available = clientDetail?.summary?.advanceBalance || 0;
    const defaultAmount = (Math.min(remaining, available) / 100).toFixed(2);
    const input = window.prompt(`Apply how much advance (₹) to invoice ${invoice.invoiceNumber}? Available: ${formatRupees(available)}`, defaultAmount);
    if (!input) return;
    const amountPaise = Math.round(parseFloat(input) * 100);
    if (!amountPaise || amountPaise <= 0) return;
    try {
      await applyAdvance({ clientId, invoiceId: invoice.id, amountPaise });
      reload();
    } catch (err) {
      window.alert(err.message || "Failed to apply advance");
    }
  };

  const handleExportInvoice = (invoice) => setExportTarget({ type: "invoice", data: invoice });
  const handleExportReceipt = (payment) => setExportTarget({ type: "receipt", data: payment });

  useEffect(() => {
    if (!exportTarget) return;
    (async () => {
      try {
        const node = exportTarget.type === "invoice" ? invoiceDocRef.current : receiptDocRef.current;
        if (!node) return;
        const fileNameBase = exportTarget.type === "invoice" ? exportTarget.data.invoiceNumber.replace(/\//g, "-") : `Receipt-${exportTarget.data.id}`;
        const blob = await getNodesPdfBlob([node], { orientation: "portrait" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileNameBase}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (exportTarget.type === "invoice") {
          await exportInvoicePdf(exportTarget.data.id, blob, fileNameBase);
        } else {
          await exportReceiptPdf(exportTarget.data.id, blob, fileNameBase);
        }
        window.alert("Saved to the client's Drive folder and downloaded locally.");
      } catch (err) {
        window.alert(err.message || "Failed to export PDF");
      } finally {
        setExportTarget(null);
      }
    })();
  }, [exportTarget]);

  if (!clientId) return null;

  const client = clientDetail?.client;
  const summary = clientDetail?.summary;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">{client?.name || "Loading…"}</h2>
            {client?.email && <p className="text-body-sm text-on-surface-variant">{client.email}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-outline-variant px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-body-sm font-medium transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingClientDetail || !clientDetail ? (
            <div className="flex justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-[28px] text-on-surface-variant">progress_activity</span>
            </div>
          ) : (
            <>
              {tab === "Overview" && summary && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Total Billed", summary.totalBilled],
                    ["Total Collected", summary.totalCollected],
                    ["Outstanding", summary.totalOutstanding],
                    ["Overdue", summary.totalOverdue],
                    ["Advance Balance", summary.advanceBalance],
                    ["Net Receivable", summary.netReceivable],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-outline-variant p-3">
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</p>
                      <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">{formatRupees(value)}</p>
                    </div>
                  ))}
                  <div className="col-span-2 flex gap-2 pt-2">
                    <button onClick={() => setInvoiceModalOpen(true)} className="flex-1 rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90">New Invoice</button>
                    <button onClick={() => setPaymentModalOpen(true)} className="flex-1 rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">Record Payment</button>
                  </div>
                </div>
              )}

              {tab === "Billing Config" && (
                <BillingConfigPanel clientId={clientId} billingConfig={client?.billingConfig} onSaved={reload} />
              )}

              {tab === "Invoices" && (
                <div className="space-y-2">
                  <button onClick={() => setInvoiceModalOpen(true)} className="mb-2 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-white hover:bg-primary/90">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    New Invoice
                  </button>
                  {(clientDetail.invoices || []).map((inv) => {
                    const balance = inv.totalPaise - inv.amountPaidPaise;
                    return (
                      <div key={inv.id} className="rounded-lg border border-outline-variant p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-on-surface">{inv.invoiceNumber}</p>
                            <p className="text-[11px] text-on-surface-variant">{inv.invoiceDate} · due {inv.dueDate}</p>
                          </div>
                          <StatusBadge status={inv.status.replace("_", " ")} color={INVOICE_STATUS_META[inv.status] || "gray"} showDot />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-body-sm">
                          <span>{formatRupees(inv.totalPaise)} {balance > 0 && <span className="text-on-surface-variant">(Due: {formatRupees(balance)})</span>}</span>
                          <div className="flex gap-1">
                            {balance > 0 && summary?.advanceBalance > 0 && (
                              <button onClick={() => handleApplyAdvance(inv)} className="rounded p-1 text-emerald-700 hover:bg-emerald-50" title="Apply advance">
                                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                              </button>
                            )}
                            {balance > 0 && (
                              <button onClick={() => setReminderInvoiceId(inv.id)} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant" title="Send reminder">
                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                              </button>
                            )}
                            <button onClick={() => handleExportInvoice(inv)} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant" title="Export PDF">
                              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                            </button>
                            <button onClick={() => handleDuplicateInvoice(inv)} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant" title="Duplicate as draft">
                              <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                            {inv.status !== "void" && (
                              <button onClick={() => handleVoidInvoice(inv)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Void">
                                <span className="material-symbols-outlined text-[18px]">block</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "Payments" && (
                <div className="space-y-2">
                  <button onClick={() => setPaymentModalOpen(true)} className="mb-2 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-white hover:bg-primary/90">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Record Payment
                  </button>
                  {(clientDetail.payments || []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-3 text-body-sm">
                      <div>
                        <p className="font-medium text-on-surface">{formatRupees(p.amountPaise)} <span className="text-[11px] text-on-surface-variant capitalize">({p.method.replace("_", " ")})</span></p>
                        <p className="text-[11px] text-on-surface-variant">{p.paymentDate} {p.referenceNumber ? `· ${p.referenceNumber}` : ""} {p.status === "reversed" ? "· REVERSED" : ""}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleExportReceipt(p)} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant" title="Export receipt PDF">
                          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        </button>
                        {p.status === "confirmed" && (
                          <button onClick={() => handleReversePayment(p)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Reverse">
                            <span className="material-symbols-outlined text-[18px]">undo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Reminders" && (
                <div className="space-y-2">
                  {(clientDetail.reminders || []).length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant">No pending follow-ups.</p>
                  ) : (
                    clientDetail.reminders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-3 text-body-sm">
                        <div>
                          <p>{r.note || (r.sentVia ? `Reminder sent via ${r.sentVia}` : "Follow-up")}</p>
                          <p className="text-[11px] text-on-surface-variant">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={async () => {
                            await completeReminder(r.id);
                            reload();
                          }}
                          className="rounded-md border border-outline-variant px-2.5 py-1 text-[11px] hover:bg-surface-variant"
                        >
                          Mark done
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "Activity" && (
                <div className="space-y-2">
                  {activity.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant">No activity recorded yet.</p>
                  ) : (
                    activity.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-body-sm">
                        <span className="material-symbols-outlined mt-0.5 text-[16px] text-primary">history</span>
                        <div>
                          <p className="capitalize text-on-surface">{log.action.replace(/_/g, " ")} {log.amountPaise ? `— ${formatRupees(log.amountPaise)}` : ""}</p>
                          <p className="text-[11px] text-on-surface-variant">{new Date(log.createdAt).toLocaleString()} {log.userName ? `· ${log.userName}` : ""}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {invoiceModalOpen && (
        <InvoiceFormModal
          clientId={clientId}
          clientName={client?.name}
          billingConfig={client?.billingConfig}
          onClose={() => setInvoiceModalOpen(false)}
          onCreated={reload}
        />
      )}
      {paymentModalOpen && (
        <RecordPaymentModal clientId={clientId} clientName={client?.name} onClose={() => setPaymentModalOpen(false)} onRecorded={reload} />
      )}
      {reminderInvoiceId && (
        <PaymentReminderComposer invoiceId={reminderInvoiceId} clientId={clientId} onClose={() => setReminderInvoiceId(null)} onSent={reload} />
      )}

      {/* Off-screen render targets for PDF capture — same pattern every
          other document-export feature in this app uses (mount the real
          template, html2canvas captures the actual DOM node). */}
      <div className="fixed left-[-9999px] top-0">
        {exportTarget?.type === "invoice" && <InvoiceDocument ref={invoiceDocRef} invoice={exportTarget.data} client={client} />}
        {exportTarget?.type === "receipt" && <PaymentReceiptDocument ref={receiptDocRef} payment={exportTarget.data} client={client} />}
      </div>
    </div>
  );
}
