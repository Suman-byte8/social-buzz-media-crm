"use client";
import React from "react";
import ShareMenu from "@/components/ui/ShareMenu";

// This is the actual Google Drive triangle logo. The previous version used
// a generic globe/language icon path, which is why "Save to Drive" never
// visually looked like Drive even when it was rendering.
const GoogleDriveIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 87.3 78" aria-hidden="true">
    <path
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
      fill="#0066DA"
    />
    <path
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
      fill="#00AC47"
    />
    <path
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
      fill="#EA4335"
    />
    <path
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
      fill="#00832D"
    />
    <path
      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
      fill="#2684FC"
    />
    <path
      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
      fill="#FFBA00"
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
  onSaveToDrive,
  isSavingPdf,
  isSavingToDrive,
  selectedClientId,
  selectedClient,
  isSharing,
  onSendWhatsApp,
  onSendEmail,
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
            <option value="intra" className="bg-white text-ink">CGST + SGST (within WB)</option>
            <option value="inter" className="bg-white text-ink">IGST (other state)</option>
            <option value="none" className="bg-white text-ink">No GST</option>
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
            <option value="none" className="bg-white text-ink">None</option>
            <option value="due" className="bg-white text-ink">Payment due</option>
            <option value="advance" className="bg-white text-ink">Advance paid</option>
            <option value="paid" className="bg-white text-ink">Paid</option>
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

        {/*
          Always rendered now (previously this whole block, icon included,
          was omitted from the DOM until a client was selected — so there
          was no visual indication a button was even supposed to be there).
          It now stays visible and disables with a tooltip instead.
        */}
        <button
          type="button"
          onClick={onSaveToDrive}
          disabled={isSavingToDrive || !selectedClientId}
          id="btnSaveToDrive"
          title={
            selectedClientId
              ? "Save to Google Drive"
              : "Select a client above to enable Drive upload"
          }
          className="flex items-center gap-2 rounded bg-[#4285F4] px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleDriveIcon />
          {isSavingToDrive ? "Uploading…" : "Save to Drive"}
        </button>

        <ShareMenu
          client={selectedClient}
          isSending={isSharing}
          onSendWhatsApp={onSendWhatsApp}
          onSendEmail={onSendEmail}
        />
      </div>
    </div>
  );
}
