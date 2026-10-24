"use client";

import React, { useState } from "react";

// A small, proper modal for the one-field inputs this module needs (a void
// reason, a reversal reason, an advance amount) — replaces window.prompt(),
// which gives no validation feedback and looks out of place next to the
// rest of this app's modal-based data entry.
export default function PromptModal({ title, label, type = "text", defaultValue = "", confirmLabel = "Confirm", helperText, onConfirm, onClose }) {
  const [value, setValue] = useState(defaultValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    const isEmpty = type === "textarea" || type === "text" ? !value.trim() : value === "" || value === null;
    if (isEmpty) {
      setError("This field is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(value);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && onClose()}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
        {helperText && <p className="mt-1 text-body-sm text-on-surface-variant">{helperText}</p>}
        {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}
        <label className="mt-3 block font-label-sm text-label-sm text-on-surface-variant">{label}</label>
        {type === "textarea" ? (
          <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} autoFocus className="mt-1 w-full resize-none rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        ) : (
          <input type={type} value={value} onChange={(e) => setValue(e.target.value)} autoFocus className="mt-1 w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
