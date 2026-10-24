"use client";

import React, { useState } from "react";
import { createInvoice, issueInvoice } from "@/services/paymentService";
import { formatRupees, rupeesToPaise } from "@/lib/formatCurrency";

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyLine = () => ({ description: "", quantity: 1, unitPriceRupees: "" });

// Deliberately not reusing components/invoices/Lineitemstable.js — that one
// uses untyped floats with no validation and is built for a one-shot PDF,
// not a reconciled ledger entry. This is a small, strict version whose
// output always gets converted to integer paise before it reaches the API.
export default function InvoiceFormModal({ clientId, clientName, billingConfig, onClose, onCreated }) {
  const prefillFromPlan = billingConfig?.planItems?.length
    ? billingConfig.planItems.map((item) => ({ description: item.serviceName, quantity: 1, unitPriceRupees: String(item.amountPaise / 100) }))
    : [emptyLine()];

  const [lineItems, setLineItems] = useState(prefillFromPlan);
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [discountRupees, setDiscountRupees] = useState("0");
  const [taxRatePercent, setTaxRatePercent] = useState(billingConfig ? String((billingConfig.taxRateBasisPoints || 0) / 100) : "0");
  const [notes, setNotes] = useState("");
  const [issueNow, setIssueNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateLine = (index, patch) => setLineItems((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const addLine = () => setLineItems((prev) => [...prev, emptyLine()]);
  const removeLine = (index) => setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const subtotalPaise = lineItems.reduce((sum, l) => sum + (parseInt(l.quantity, 10) || 0) * rupeesToPaise(l.unitPriceRupees), 0);
  const discountPaise = rupeesToPaise(discountRupees);
  const taxableAmount = Math.max(subtotalPaise - discountPaise, 0);
  // Preview only — the server recomputes everything from taxRateBasisPoints.
  const previewTaxPaise = Math.round((taxableAmount * (parseFloat(taxRatePercent) || 0)) / 100);
  const totalPaise = taxableAmount + previewTaxPaise;

  const handleSubmit = async () => {
    setError("");
    const validLines = lineItems.filter((l) => l.description.trim() && parseInt(l.quantity, 10) > 0 && l.unitPriceRupees !== "");
    if (validLines.length === 0) {
      setError("Add at least one valid line item.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        clientId,
        billingConfigId: billingConfig?.id || undefined,
        invoiceDate,
        dueDate,
        discountPaise,
        taxRateBasisPoints: Math.round((parseFloat(taxRatePercent) || 0) * 100),
        notes: notes.trim() || undefined,
        lineItems: validLines.map((l) => ({ description: l.description.trim(), quantity: parseInt(l.quantity, 10), unitPricePaise: rupeesToPaise(l.unitPriceRupees) })),
      };
      const res = await createInvoice(payload);
      let invoice = res.data;
      if (issueNow) {
        const issued = await issueInvoice(invoice.id);
        invoice = issued.data;
      }
      onCreated(invoice);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && onClose()}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">New Invoice</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">For {clientName}{billingConfig ? " — pre-filled from the billing plan" : ""}</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Invoice date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Due date *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Line items</label>
          <div className="space-y-2">
            {lineItems.map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={line.description}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                  placeholder="Description"
                  className="flex-1 rounded-md border border-outline-variant px-2.5 py-1.5 text-body-sm"
                />
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  className="w-16 rounded-md border border-outline-variant px-2 py-1.5 text-body-sm"
                  title="Quantity"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPriceRupees}
                  onChange={(e) => updateLine(index, { unitPriceRupees: e.target.value })}
                  placeholder="Unit price (₹)"
                  className="w-32 rounded-md border border-outline-variant px-2 py-1.5 text-body-sm"
                />
                <button type="button" onClick={() => removeLine(index)} className="rounded p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLine} className="mt-2 flex items-center gap-1 text-body-sm text-primary hover:underline">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add line
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Discount (₹)</label>
            <input type="number" min="0" step="0.01" value={discountRupees} onChange={(e) => setDiscountRupees(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Tax rate (%)</label>
            <input type="number" min="0" step="0.01" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </div>

        <div className="mt-4 rounded-lg bg-surface-container-lowest p-3 text-body-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatRupees(subtotalPaise)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-{formatRupees(discountPaise)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatRupees(previewTaxPaise)}</span></div>
          <div className="mt-1 flex justify-between border-t border-outline-variant pt-1 font-medium"><span>Total</span><span>{formatRupees(totalPaise)}</span></div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-body-sm text-on-surface">
          <input type="checkbox" checked={issueNow} onChange={(e) => setIssueNow(e.target.checked)} />
          Issue immediately (otherwise saved as a draft)
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Saving…" : issueNow ? "Create & Issue" : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
