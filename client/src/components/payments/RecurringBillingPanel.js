"use client";

import React, { useState } from "react";
import { previewRecurringInvoices, generateRecurringInvoices } from "@/services/paymentService";
import { formatRupees } from "@/lib/formatCurrency";

// Manual preview -> confirm only, deliberately no cron — see the module's
// own plan: "never assume a client owes a new month's fee until an invoice
// has actually been generated."
export default function RecurringBillingPanel({ onClose, onGenerated }) {
  const [candidates, setCandidates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const loadPreview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await previewRecurringInvoices();
      setCandidates(res.data);
    } catch (err) {
      setError(err.message || "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await generateRecurringInvoices();
      setResult(res.data);
      onGenerated?.(res.data);
    } catch (err) {
      setError(err.message || "Failed to generate invoices");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Generate Recurring Invoices</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">Preview which clients are due for their next billing period before anything is created.</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        {!candidates && !result && (
          <button type="button" onClick={loadPreview} disabled={loading} className="mt-4 rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Loading…" : "Load Preview"}
          </button>
        )}

        {result && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-body-sm text-emerald-800">
            {result.length} invoice(s) generated.
          </div>
        )}

        {candidates && !result && (
          <>
            {candidates.length === 0 ? (
              <p className="mt-4 text-body-sm text-on-surface-variant">No clients are currently due for a new recurring invoice.</p>
            ) : (
              <div className="mt-4 space-y-1.5">
                {candidates.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-outline-variant px-3 py-2 text-body-sm">
                    <div>
                      <p className="font-medium text-on-surface">{c.clientName}</p>
                      <p className="text-[11px] text-on-surface-variant">{c.billingPeriodStart} to {c.billingPeriodEnd} · due {c.dueDate}</p>
                    </div>
                    <span>{formatRupees(c.totalPaise)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            {result ? "Close" : "Cancel"}
          </button>
          {candidates && candidates.length > 0 && !result && (
            <button type="button" onClick={handleGenerate} disabled={generating} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {generating ? "Generating…" : `Generate ${candidates.length} Invoice(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
