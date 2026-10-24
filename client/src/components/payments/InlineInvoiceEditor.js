"use client";

import React, { useState } from "react";
import { createInvoice, updateInvoice, issueInvoice } from "@/services/paymentService";
import { formatRupees, rupeesToPaise } from "@/lib/formatCurrency";

const todayISO = () => new Date().toISOString().slice(0, 10);
const emptyLine = () => ({ description: "", quantity: 1, unitPriceRupees: "" });

// Inline, in-page invoice entry — not a popup. The client already has a
// dedicated tool for authoring/sending invoice documents (the Invoice
// Builder at /invoices); this is just enough to get a line-itemed record
// into the payment ledger, editable as a real table rather than through a
// separate form.
export default function InlineInvoiceEditor({ clientId, billingConfig, invoiceToEdit, onDone, onCancel }) {
  const isEdit = Boolean(invoiceToEdit);
  const prefill = () => {
    if (invoiceToEdit) {
      return (invoiceToEdit.lineItems || []).map((li) => ({ description: li.description, quantity: li.quantity, unitPriceRupees: String(li.unitPricePaise / 100) }));
    }
    if (billingConfig?.planItems?.length) {
      return billingConfig.planItems.map((item) => ({ description: item.serviceName, quantity: 1, unitPriceRupees: String(item.amountPaise / 100) }));
    }
    return [emptyLine()];
  };

  const [lineItems, setLineItems] = useState(prefill);
  const [invoiceDate, setInvoiceDate] = useState(invoiceToEdit?.invoiceDate || todayISO());
  const [dueDate, setDueDate] = useState(invoiceToEdit?.dueDate || "");
  const [discountRupees, setDiscountRupees] = useState(invoiceToEdit ? String(invoiceToEdit.discountPaise / 100) : "0");
  const [taxRatePercent, setTaxRatePercent] = useState(
    invoiceToEdit ? String((invoiceToEdit.taxPaise ? (invoiceToEdit.taxPaise / Math.max(invoiceToEdit.subtotalPaise - invoiceToEdit.discountPaise, 1)) * 100 : 0).toFixed(2)) : billingConfig ? String((billingConfig.taxRateBasisPoints || 0) / 100) : "0"
  );
  const [notes, setNotes] = useState(invoiceToEdit?.notes || "");
  const [issueNow, setIssueNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateLine = (index, patch) => setLineItems((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const addLine = () => setLineItems((prev) => [...prev, emptyLine()]);
  const removeLine = (index) => setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const subtotalPaise = lineItems.reduce((sum, l) => sum + (parseInt(l.quantity, 10) || 0) * rupeesToPaise(l.unitPriceRupees), 0);
  const discountPaise = rupeesToPaise(discountRupees);
  const taxableAmount = Math.max(subtotalPaise - discountPaise, 0);
  const previewTaxPaise = Math.round((taxableAmount * (parseFloat(taxRatePercent) || 0)) / 100);
  const totalPaise = taxableAmount + previewTaxPaise;

  const handleSave = async () => {
    setError("");
    const validLines = lineItems.filter((l) => l.description.trim() && parseInt(l.quantity, 10) > 0 && l.unitPriceRupees !== "");
    if (validLines.length === 0) {
      setError("Add at least one line with a description, quantity, and price.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    setSubmitting(true);
    try {
      const sharedPayload = {
        invoiceDate,
        dueDate,
        discountPaise,
        taxRateBasisPoints: Math.round((parseFloat(taxRatePercent) || 0) * 100),
        notes: notes.trim() || undefined,
        lineItems: validLines.map((l) => ({ description: l.description.trim(), quantity: parseInt(l.quantity, 10), unitPricePaise: rupeesToPaise(l.unitPriceRupees) })),
      };
      let invoice;
      if (isEdit) {
        const res = await updateInvoice(invoiceToEdit.id, { ...sharedPayload, expectedRevision: invoiceToEdit.revision });
        invoice = res.data;
      } else {
        const res = await createInvoice({ clientId, billingConfigId: billingConfig?.id || undefined, ...sharedPayload });
        invoice = res.data;
        if (issueNow) {
          const issued = await issueInvoice(invoice.id);
          invoice = issued.data;
        }
      }
      onDone(invoice);
    } catch (err) {
      setError(err.message || "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-label-md text-label-md text-on-surface">{isEdit ? `Editing ${invoiceToEdit.invoiceNumber}` : "New Invoice"}</h4>
        <button type="button" onClick={onCancel} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Invoice date</label>
          <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full rounded-md border border-outline-variant bg-white px-3 py-1.5 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Due date *</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-outline-variant bg-white px-3 py-1.5 text-body-sm" />
        </div>
      </div>

      {/* A real editable table — click any cell to change it, add/remove
          rows directly, instead of a separate line-item form. */}
      <div className="mt-3 overflow-hidden rounded-md border border-outline-variant bg-white">
        <table className="w-full border-collapse text-body-sm">
          <thead>
            <tr className="bg-surface-container-lowest text-left">
              <th className="px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Description</th>
              <th className="w-16 px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Qty</th>
              <th className="w-32 px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Unit Price (₹)</th>
              <th className="w-28 px-2 py-1.5 text-right font-label-sm text-label-sm text-on-surface-variant">Amount</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((line, index) => (
              <tr key={index} className="border-t border-outline-variant">
                <td className="p-0">
                  <input
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    placeholder="Description"
                    className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5"
                  />
                </td>
                <td className="p-0">
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                    className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5"
                  />
                </td>
                <td className="p-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPriceRupees}
                    onChange={(e) => updateLine(index, { unitPriceRupees: e.target.value })}
                    className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5"
                  />
                </td>
                <td className="px-2 py-1.5 text-right text-on-surface-variant">{formatRupees((parseInt(line.quantity, 10) || 0) * rupeesToPaise(line.unitPriceRupees))}</td>
                <td className="px-1">
                  <button type="button" onClick={() => removeLine(index)} className="rounded p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addLine} className="flex w-full items-center gap-1 border-t border-outline-variant px-2 py-1.5 text-body-sm text-primary hover:bg-primary/5">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add row
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Discount (₹)</label>
          <input type="number" min="0" step="0.01" value={discountRupees} onChange={(e) => setDiscountRupees(e.target.value)} className="w-full rounded-md border border-outline-variant bg-white px-3 py-1.5 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Tax rate (%)</label>
          <input type="number" min="0" step="0.01" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} className="w-full rounded-md border border-outline-variant bg-white px-3 py-1.5 text-body-sm" />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-outline-variant bg-white px-3 py-1.5 text-body-sm" />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-3 text-body-sm">
        <div className="flex gap-4">
          <span>Subtotal: <strong>{formatRupees(subtotalPaise)}</strong></span>
          <span>Tax: <strong>{formatRupees(previewTaxPaise)}</strong></span>
          <span>Total: <strong>{formatRupees(totalPaise)}</strong></span>
        </div>
        {!isEdit && (
          <label className="flex items-center gap-1.5 text-[12px] text-on-surface">
            <input type="checkbox" checked={issueNow} onChange={(e) => setIssueNow(e.target.checked)} />
            Issue immediately
          </label>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={submitting} className="rounded-md border border-outline-variant bg-white px-4 py-1.5 text-body-sm hover:bg-surface-variant">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={submitting} className="rounded-md bg-primary px-4 py-1.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
          {submitting ? "Saving…" : isEdit ? "Save Changes" : issueNow ? "Create & Issue" : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
