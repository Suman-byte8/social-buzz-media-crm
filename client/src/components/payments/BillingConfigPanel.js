"use client";

import React, { useState } from "react";
import { createBillingConfig, updateBillingConfig } from "@/services/paymentService";
import { rupeesToPaise } from "@/lib/formatCurrency";

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One-time" },
];

const emptyItem = () => ({ serviceName: "", amountRupees: "", isOneTime: false });

const toEditableItems = (planItems) =>
  planItems?.length ? planItems.map((i) => ({ id: i.id, serviceName: i.serviceName, amountRupees: String(i.amountPaise / 100), isOneTime: i.isOneTime })) : [emptyItem()];

export default function BillingConfigPanel({ clientId, billingConfig, onSaved }) {
  // No billing config at all yet — a single setup form (settings + services
  // together), since there's nothing to show as a table until one exists.
  if (!billingConfig) {
    return <SetupForm clientId={clientId} onSaved={onSaved} />;
  }

  return (
    <div className="space-y-5">
      <SettingsSection clientId={clientId} billingConfig={billingConfig} onSaved={onSaved} />
      <ServicesTable clientId={clientId} billingConfig={billingConfig} onSaved={onSaved} />
    </div>
  );
}

function SettingsSection({ clientId, billingConfig, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [frequency, setFrequency] = useState(billingConfig.billingFrequency);
  const [startDate, setStartDate] = useState(billingConfig.billingStartDate || "");
  const [billingDay, setBillingDay] = useState(billingConfig.billingDay || 1);
  const [dueInDays, setDueInDays] = useState(billingConfig.dueInDays ?? 15);
  const [taxRatePercent, setTaxRatePercent] = useState(String((billingConfig.taxRateBasisPoints || 0) / 100));
  const [status, setStatus] = useState(billingConfig.status);
  const [notes, setNotes] = useState(billingConfig.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await updateBillingConfig(clientId, {
        billingFrequency: frequency,
        billingStartDate: startDate || null,
        billingDay: billingDay ? parseInt(billingDay, 10) : null,
        dueInDays: parseInt(dueInDays, 10) || 15,
        taxRateBasisPoints: Math.round((parseFloat(taxRatePercent) || 0) * 100),
        status,
        notes: notes.trim() || null,
      });
      onSaved(res.data);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-title-md text-title-md text-on-surface">Billing Settings</h3>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-md border border-outline-variant px-2.5 py-1 text-[12px] font-medium hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border border-outline-variant p-3 text-body-sm">
          <p>Frequency: <span className="font-medium capitalize">{billingConfig.billingFrequency.replace("_", " ")}</span></p>
          <p>Status: <span className="font-medium capitalize">{billingConfig.status}</span></p>
          <p>Due period: <span className="font-medium">{billingConfig.dueInDays} days</span></p>
          <p>Tax rate: <span className="font-medium">{(billingConfig.taxRateBasisPoints / 100).toFixed(2)}%</span></p>
          {billingConfig.billingStartDate && <p>Start date: <span className="font-medium">{billingConfig.billingStartDate}</span></p>}
          {billingConfig.billingDay && <p>Billing day: <span className="font-medium">{billingConfig.billingDay}</span></p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-title-md text-title-md text-on-surface">Billing Settings</h3>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Field label="Frequency">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm">
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Billing start date">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
        <Field label="Billing day (1-28)">
          <input type="number" min="1" max="28" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
        <Field label="Invoice due period (days)">
          <input type="number" min="0" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
        <Field label="Tax rate (%)">
          <input type="number" min="0" step="0.01" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// A genuinely editable table — every cell is a live input, add/remove rows
// directly, no separate "Edit" mode to enter first.
function ServicesTable({ clientId, billingConfig, onSaved }) {
  const [items, setItems] = useState(toEditableItems(billingConfig.planItems));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    setDirty(true);
  };
  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
    setDirty(true);
  };
  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    setDirty(true);
  };

  const handleSave = async () => {
    setError("");
    const validItems = items.filter((i) => i.serviceName.trim() && i.amountRupees !== "");
    if (validItems.length === 0) {
      setError("Add at least one priced service.");
      return;
    }
    setSaving(true);
    try {
      const res = await updateBillingConfig(clientId, {
        planItems: validItems.map((i) => ({ serviceName: i.serviceName.trim(), amountPaise: rupeesToPaise(i.amountRupees), isOneTime: i.isOneTime })),
      });
      onSaved(res.data);
      setDirty(false);
    } catch (err) {
      setError(err.message || "Failed to save services");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="font-title-md text-title-md text-on-surface">Services</h3>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}
      <div className="mt-2 overflow-hidden rounded-md border border-outline-variant">
        <table className="w-full border-collapse text-body-sm">
          <thead>
            <tr className="bg-surface-container-lowest text-left">
              <th className="px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Service</th>
              <th className="w-32 px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Price (₹)</th>
              <th className="w-24 px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">One-time</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index} className="border-t border-outline-variant">
                <td className="p-0">
                  <input value={item.serviceName} onChange={(e) => updateItem(index, { serviceName: e.target.value })} placeholder="Service name" className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5" />
                </td>
                <td className="p-0">
                  <input type="number" min="0" step="0.01" value={item.amountRupees} onChange={(e) => updateItem(index, { amountRupees: e.target.value })} className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5" />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input type="checkbox" checked={item.isOneTime} onChange={(e) => updateItem(index, { isOneTime: e.target.checked })} />
                </td>
                <td className="px-1">
                  <button type="button" onClick={() => removeItem(index)} className="rounded p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addItem} className="flex w-full items-center gap-1 border-t border-outline-variant px-2 py-1.5 text-body-sm text-primary hover:bg-primary/5">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add service
        </button>
      </div>
      {dirty && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-body-sm">
          <span className="text-amber-800">Unsaved changes</span>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save Services"}
          </button>
        </div>
      )}
    </div>
  );
}

function SetupForm({ clientId, onSaved }) {
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [billingDay, setBillingDay] = useState(1);
  const [dueInDays, setDueInDays] = useState(15);
  const [taxRatePercent, setTaxRatePercent] = useState("0");
  const [items, setItems] = useState([emptyItem()]);
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
      const res = await createBillingConfig(clientId, {
        billingFrequency: frequency,
        billingStartDate: startDate || null,
        billingDay: billingDay ? parseInt(billingDay, 10) : null,
        dueInDays: parseInt(dueInDays, 10) || 15,
        taxRateBasisPoints: Math.round((parseFloat(taxRatePercent) || 0) * 100),
        status: "active",
        planItems: validItems.map((i) => ({ serviceName: i.serviceName.trim(), amountPaise: rupeesToPaise(i.amountRupees), isOneTime: i.isOneTime })),
      });
      onSaved(res.data);
    } catch (err) {
      setError(err.message || "Failed to set up billing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="font-title-md text-title-md text-on-surface">Set Up Billing</h3>
      <p className="mt-0.5 text-body-sm text-on-surface-variant">This client has no billing configuration yet — add one to start generating invoices.</p>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Frequency">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm">
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Tax rate (%)">
          <input type="number" min="0" step="0.01" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
        <Field label="Billing start date">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
        <Field label="Invoice due period (days)">
          <input type="number" min="0" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        </Field>
      </div>

      <div className="mt-4">
        <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Services</label>
        <div className="overflow-hidden rounded-md border border-outline-variant">
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="bg-surface-container-lowest text-left">
                <th className="px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Service</th>
                <th className="w-32 px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">Price (₹)</th>
                <th className="w-24 px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant">One-time</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t border-outline-variant">
                  <td className="p-0">
                    <input value={item.serviceName} onChange={(e) => updateItem(index, { serviceName: e.target.value })} placeholder="Service name" className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5" />
                  </td>
                  <td className="p-0">
                    <input type="number" min="0" step="0.01" value={item.amountRupees} onChange={(e) => updateItem(index, { amountRupees: e.target.value })} className="w-full border-0 bg-transparent px-2 py-1.5 text-body-sm outline-none focus:bg-primary/5" />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={item.isOneTime} onChange={(e) => updateItem(index, { isOneTime: e.target.checked })} />
                  </td>
                  <td className="px-1">
                    <button type="button" onClick={() => removeItem(index)} className="rounded p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addItem} className="flex w-full items-center gap-1 border-t border-outline-variant px-2 py-1.5 text-body-sm text-primary hover:bg-primary/5">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add service
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving…" : "Save Billing Configuration"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}
