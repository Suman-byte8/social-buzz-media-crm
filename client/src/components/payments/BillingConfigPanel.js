"use client";

import React, { useState } from "react";
import { createBillingConfig, updateBillingConfig } from "@/services/paymentService";

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One-time" },
];

const emptyItem = () => ({ serviceName: "", amountRupees: "", isOneTime: false });

export default function BillingConfigPanel({ clientId, billingConfig, onSaved }) {
  const [editing, setEditing] = useState(!billingConfig);
  const [frequency, setFrequency] = useState(billingConfig?.billingFrequency || "monthly");
  const [startDate, setStartDate] = useState(billingConfig?.billingStartDate || "");
  const [billingDay, setBillingDay] = useState(billingConfig?.billingDay || 1);
  const [dueInDays, setDueInDays] = useState(billingConfig?.dueInDays ?? 15);
  const [taxRatePercent, setTaxRatePercent] = useState(billingConfig ? String((billingConfig.taxRateBasisPoints || 0) / 100) : "0");
  const [status, setStatus] = useState(billingConfig?.status || "active");
  const [notes, setNotes] = useState(billingConfig?.notes || "");
  const [items, setItems] = useState(
    billingConfig?.planItems?.length ? billingConfig.planItems.map((i) => ({ serviceName: i.serviceName, amountRupees: String(i.amountPaise / 100), isOneTime: i.isOneTime })) : [emptyItem()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (index, patch) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const handleSave = async () => {
    setError("");
    const validItems = items.filter((i) => i.serviceName.trim() && i.amountRupees !== "");
    if (validItems.length === 0) {
      setError("Add at least one priced service.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        billingFrequency: frequency,
        billingStartDate: startDate || null,
        billingDay: billingDay ? parseInt(billingDay, 10) : null,
        dueInDays: parseInt(dueInDays, 10) || 15,
        taxRateBasisPoints: Math.round((parseFloat(taxRatePercent) || 0) * 100),
        status,
        notes: notes.trim() || null,
        planItems: validItems.map((i) => ({ serviceName: i.serviceName.trim(), amountPaise: Math.round((parseFloat(i.amountRupees) || 0) * 100), isOneTime: i.isOneTime })),
      };
      const res = billingConfig ? await updateBillingConfig(clientId, payload) : await createBillingConfig(clientId, payload);
      onSaved(res.data);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to save billing configuration");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-title-md text-title-md text-on-surface">Billing Configuration</h3>
          <button onClick={() => setEditing(true)} className="rounded-md border border-outline-variant px-3 py-1.5 text-body-sm hover:bg-surface-variant">Edit</button>
        </div>
        <div className="rounded-lg border border-outline-variant p-3 text-body-sm">
          <p>Frequency: <span className="font-medium capitalize">{billingConfig.billingFrequency.replace("_", " ")}</span></p>
          <p>Status: <span className="font-medium capitalize">{billingConfig.status}</span></p>
          <p>Due period: <span className="font-medium">{billingConfig.dueInDays} days</span></p>
          <p>Tax rate: <span className="font-medium">{(billingConfig.taxRateBasisPoints / 100).toFixed(2)}%</span></p>
        </div>
        <div className="space-y-1">
          {(billingConfig.planItems || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-outline-variant px-3 py-2 text-body-sm">
              <span>{item.serviceName} {item.isOneTime && <span className="text-[11px] text-on-surface-variant">(one-time)</span>}</span>
              <span>₹{(item.amountPaise / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-title-md text-title-md text-on-surface">{billingConfig ? "Edit" : "Set Up"} Billing Configuration</h3>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm">
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Billing start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Billing day (1-28)</label>
          <input type="number" min="1" max="28" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Invoice due period (days)</label>
          <input type="number" min="0" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </div>
        <div>
          <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Tax rate (%)</label>
          <input type="number" min="0" step="0.01" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Services</label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input value={item.serviceName} onChange={(e) => updateItem(index, { serviceName: e.target.value })} placeholder="Service name" className="flex-1 rounded-md border border-outline-variant px-2.5 py-1.5 text-body-sm" />
              <input type="number" min="0" step="0.01" value={item.amountRupees} onChange={(e) => updateItem(index, { amountRupees: e.target.value })} placeholder="₹" className="w-28 rounded-md border border-outline-variant px-2 py-1.5 text-body-sm" />
              <label className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                <input type="checkbox" checked={item.isOneTime} onChange={(e) => updateItem(index, { isOneTime: e.target.checked })} />
                One-time
              </label>
              <button type="button" onClick={() => removeItem(index)} className="rounded p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1 text-body-sm text-primary hover:underline">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add service
        </button>
      </div>

      <div>
        <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
      </div>

      <div className="flex justify-end gap-2">
        {billingConfig && (
          <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
        )}
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
