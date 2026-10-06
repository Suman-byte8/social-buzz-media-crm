"use client";
import React, { useState } from "react";

export default function SaveAsTemplateModal({ open, onClose, onSave, saving, error }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-title-lg text-title-lg text-on-surface">Save as template</h3>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Saves this report&apos;s current pages/layout as a reusable starting point for future reports.
        </p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        <div className="mt-4 space-y-3">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant">Template name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Our Monthly SEO Layout"
              className="mt-1 w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-body-sm text-on-surface">
            <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
            Share with the whole team (otherwise only you can use it)
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => onSave({ name: name.trim(), description: description.trim(), isShared })}
            className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>
    </div>
  );
}
