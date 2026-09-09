"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addClientFileLink } from "@/redux/slices/documentsSlice";

const LINK_TYPE_CONFIG = {
  google_sheet: {
    title: "Add Google Sheet",
    icon: "table_chart",
    color: "emerald",
    placeholder: "https://docs.google.com/spreadsheets/d/...",
    defaultLabel: "Google Sheet",
  },
  google_doc: {
    title: "Add Google Doc",
    icon: "description",
    color: "blue",
    placeholder: "https://docs.google.com/document/d/...",
    defaultLabel: "Google Doc",
  },
};

const COLOR_CLASSES = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", button: "bg-blue-600 hover:bg-blue-700" },
};

// Same shape/tone as SheetSyncModal.js (Content Calendar's Google Sheet
// connect flow) but much simpler: this doesn't parse or sync the sheet's
// contents, it just records the shared link so it shows up as a card in
// the Strategy tab's file list, next to regular uploads.
export default function AddStrategyLinkModal({ isOpen, onClose, linkType, clientId, documentType, onSuccess }) {
  const dispatch = useDispatch();
  const [linkUrl, setLinkUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const config = LINK_TYPE_CONFIG[linkType] || LINK_TYPE_CONFIG.google_sheet;
  const colors = COLOR_CLASSES[config.color];

  useEffect(() => {
    if (isOpen) {
      setLinkUrl("");
      setLabel("");
      setError("");
    }
  }, [isOpen, linkType]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setError("Please paste a link.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await dispatch(
        addClientFileLink({ clientId, documentType, linkType, linkUrl: linkUrl.trim(), label: label.trim() })
      ).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to add link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">{config.title}</h3>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Link <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder={config.placeholder}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={saving}
              autoFocus
              className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Make sure it&apos;s shared as &quot;Anyone with the link can view&quot; before sharing it here.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Label (optional)</label>
            <input
              type="text"
              placeholder={config.defaultLabel}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={saving}
              className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={saving} className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !linkUrl.trim()}
              className={`px-4 py-2 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${colors.button}`}
            >
              <span className="material-symbols-outlined text-[16px]">{saving ? "progress_activity" : "link"}</span>
              {saving ? "Adding..." : "Add Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
