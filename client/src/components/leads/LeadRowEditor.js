"use client";

import React from "react";

const SOURCE_OPTIONS = ["LinkedIn", "Website Organic", "Referral", "Cold Outreach", "Other"];
const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "hot", label: "Hot Prospect" },
  { value: "lost", label: "Lost" },
];

const inputClass =
  "w-full px-2 py-1 border border-gray-300 rounded text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none";

// Inline "add a row" editor for the leads table, same shape as
// ContentCalendarRowEditor.js — spreadsheet-style add instead of a modal,
// so adding several leads in a row doesn't mean opening/closing a dialog
// each time.
export default function LeadRowEditor({ values, onChange, onSave, onCancel, saving, error }) {
  return (
    <tr className="bg-primary-container/10">
      <td className="p-2 align-top">
        <div className="space-y-1">
          <input
            type="text"
            value={values.companyName || ""}
            onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="Company name *"
            className={inputClass}
            disabled={saving}
          />
          <div className="flex gap-1">
            <input
              type="text"
              value={values.contactName || ""}
              onChange={(e) => onChange("contactName", e.target.value)}
              placeholder="Contact name"
              className={inputClass}
              disabled={saving}
            />
            <input
              type="email"
              value={values.email || ""}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="Email"
              className={inputClass}
              disabled={saving}
            />
          </div>
          <input
            type="text"
            value={values.phone || ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Phone"
            className={inputClass}
            disabled={saving}
          />
        </div>
      </td>
      <td className="p-2 align-top">
        <input
          list="lead-row-source-options"
          type="text"
          value={values.source || ""}
          onChange={(e) => onChange("source", e.target.value)}
          placeholder="Source"
          className={inputClass}
          disabled={saving}
        />
        <datalist id="lead-row-source-options">
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </td>
      <td className="p-2 align-top">
        <select
          value={values.status || "new"}
          onChange={(e) => onChange("status", e.target.value)}
          className={inputClass}
          disabled={saving}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="p-2 align-top text-on-surface-variant text-xs">—</td>
      <td className="p-2 align-top">
        <input
          type="datetime-local"
          value={values.nextFollowUpAt || ""}
          onChange={(e) => onChange("nextFollowUpAt", e.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="p-2 align-top text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-2 py-1 bg-primary text-white rounded text-[11px] font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
              title="Save lead"
            >
              <span className="material-symbols-outlined text-[14px]">
                {saving ? "progress_activity" : "check"}
              </span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-[11px]"
              title="Cancel"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          {error && <p className="text-[10px] text-red-600 max-w-[140px] whitespace-normal text-right">{error}</p>}
        </div>
      </td>
    </tr>
  );
}
