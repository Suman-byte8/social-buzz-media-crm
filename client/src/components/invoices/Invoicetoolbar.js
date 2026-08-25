"use client";
import React from "react";

const GoogleDriveIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
    />
  </svg>
);

export default function InvoiceToolbar({
  onAddRow,
  gstMode,
  onGstModeChange,
  gstRate,
  onGstRateChange,
  roundOff,
  onRoundOffChange,
  stampMode,
  onStampModeChange,
  onSavePdf,
  onShare,
  onSaveToDrive,
  isSavingPdf,
  isSavingToDrive,
  selectedClientId,
}) {
  return (
    <div className="no-print sticky top-0 z-30 bg-ink text-white">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        <span className="font-display text-[11px] font-700 uppercase tracking-[.2em] text-white/50">
          Invoice builder
        </span>

        <button
          type="button"
          onClick={onAddRow}
          className="rounded bg-[#E8262A] px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-[#c81f23] focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          + Add line item
        </button>

        <label className="flex items-center gap-2 text-[12px] text-white/70">
          Tax
          <select
            value={gstMode}
            onChange={(e) => onGstModeChange(e.target.value)}
            className="rounded bg-white/10 px-2 py-1 text-[12px] text-white focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <option value="intra">CGST + SGST (within WB)</option>
            <option value="inter">IGST (other state)</option>
            <option value="none">No GST</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-[12px] text-white/70">
          Rate
          <input
            type="number"
            value={gstRate}
            onChange={(e) => onGstRateChange(parseFloat(e.target.value) || 0)}
            className="w-14 rounded bg-white/10 px-2 py-1 text-[12px] font-mono text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            min="0"
            step="0.5"
            disabled={gstMode === "none"}
          />
          %
        </label>

        <label className="flex items-center gap-2 text-[12px] text-white/70">
          <input
            type="checkbox"
            checked={roundOff}
            onChange={(e) => onRoundOffChange(e.target.checked)}
            className="accent-[#E8262A]"
          />
          Round off
        </label>

        <label className="flex items-center gap-2 text-[12px] text-white/70">
          Stamp
          <select
            value={stampMode}
            onChange={(e) => onStampModeChange(e.target.value)}
            className="rounded bg-white/10 px-2 py-1 text-[12px] text-white focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <option value="none">None</option>
            <option value="due">Payment due</option>
            <option value="paid">Paid</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onSavePdf}
          disabled={isSavingPdf}
          id="btnSave"
          className="rounded bg-[#E8262A] px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-[#c81f23] focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-60"
        >
          {isSavingPdf ? "Saving…" : "Save PDF"}
        </button>

        {selectedClientId && (
          <button
            type="button"
            onClick={onSaveToDrive}
            disabled={isSavingToDrive}
            id="btnSaveToDrive"
            className="rounded bg-[#4285F4] px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-60 flex items-center gap-2"
            title="Save to Google Drive"
          >
            <GoogleDriveIcon />
            {isSavingToDrive ? "Uploading…" : "Save to Drive"}
          </button>
        )}

        <button
          type="button"
          className="ml-auto rounded border border-white/30 px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-white hover:text-ink focus:outline-none focus:ring-2 focus:ring-white/60"
          onClick={onShare}
        >
          Share
        </button>
      </div>
    </div>
  );
}
