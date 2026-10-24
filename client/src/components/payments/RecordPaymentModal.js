"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchInvoices, recordPayment } from "@/services/paymentService";
import { formatRupees, rupeesToPaise } from "@/lib/formatCurrency";

const todayISO = () => new Date().toISOString().slice(0, 10);

const METHODS = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer / NEFT / IMPS" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "razorpay", label: "Razorpay" },
  { value: "other", label: "Other" },
];

export default function RecordPaymentModal({ clientId, clientName, onClose, onRecorded }) {
  const [openInvoices, setOpenInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [amountRupees, setAmountRupees] = useState("");
  const [method, setMethod] = useState("upi");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [allocationByInvoice, setAllocationByInvoice] = useState({}); // invoiceId -> rupees string, only for checked rows
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoadingInvoices(true);
      try {
        const res = await fetchInvoices({ clientId, limit: 100 });
        const open = (res.data || []).filter((inv) => ["issued", "partially_paid", "overdue"].includes(inv.status) && inv.totalPaise - inv.amountPaidPaise > 0);
        setOpenInvoices(open);
      } finally {
        setLoadingInvoices(false);
      }
    })();
  }, [clientId]);

  const amountPaise = rupeesToPaise(amountRupees);
  const allocatedPaise = useMemo(
    () => Object.values(allocationByInvoice).reduce((sum, v) => sum + rupeesToPaise(v), 0),
    [allocationByInvoice]
  );
  const remainderPaise = Math.max(amountPaise - allocatedPaise, 0);
  const overAllocated = allocatedPaise > amountPaise;

  const toggleInvoice = (invoice) => {
    setAllocationByInvoice((prev) => {
      const next = { ...prev };
      if (next[invoice.id] !== undefined) {
        delete next[invoice.id];
      } else {
        const remaining = invoice.totalPaise - invoice.amountPaidPaise;
        const available = Math.max(amountPaise - allocatedPaise, 0);
        next[invoice.id] = (Math.min(remaining, available || remaining) / 100).toFixed(2);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!amountPaise || amountPaise <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    if (overAllocated) {
      setError("Allocated amounts exceed the payment amount.");
      return;
    }
    setSubmitting(true);
    try {
      const allocations = Object.entries(allocationByInvoice)
        .map(([invoiceId, rupees]) => ({ invoiceId: parseInt(invoiceId, 10), amountPaise: rupeesToPaise(rupees) }))
        .filter((a) => a.amountPaise > 0);
      const res = await recordPayment({
        clientId,
        paymentDate,
        amountPaise,
        method,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations,
      });
      onRecorded(res.data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && onClose()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Record Payment</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">For {clientName}</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Payment date</label>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Amount received (₹) *</label>
            <input type="number" min="0" step="0.01" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm">
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Reference / UTR</label>
            <input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Allocate to invoices (optional — anything left over becomes available advance)</label>
          {loadingInvoices ? (
            <p className="text-body-sm text-on-surface-variant">Loading open invoices…</p>
          ) : openInvoices.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No open invoices for this client — the full amount will be recorded as advance.</p>
          ) : (
            <div className="space-y-1.5">
              {openInvoices.map((inv) => {
                const remaining = inv.totalPaise - inv.amountPaidPaise;
                const checked = allocationByInvoice[inv.id] !== undefined;
                return (
                  <div key={inv.id} className="flex items-center gap-2 rounded-md border border-outline-variant px-2.5 py-1.5">
                    <input type="checkbox" checked={checked} onChange={() => toggleInvoice(inv)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm text-on-surface">{inv.invoiceNumber}</p>
                      <p className="text-[11px] text-on-surface-variant">Remaining: {formatRupees(remaining)}</p>
                    </div>
                    {checked && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocationByInvoice[inv.id]}
                        onChange={(e) => setAllocationByInvoice((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                        className="w-28 rounded-md border border-outline-variant px-2 py-1 text-body-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </div>

        <div className={`mt-4 rounded-lg p-3 text-body-sm ${overAllocated ? "bg-red-50 text-red-700" : "bg-surface-container-lowest"}`}>
          <div className="flex justify-between"><span>Allocated to invoices</span><span>{formatRupees(allocatedPaise)}</span></div>
          <div className="flex justify-between font-medium"><span>{overAllocated ? "Over-allocated by" : "Remaining → advance"}</span><span>{formatRupees(overAllocated ? allocatedPaise - amountPaise : remainderPaise)}</span></div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
