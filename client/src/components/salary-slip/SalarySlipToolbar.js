"use client";
import React from "react";

// Same actual Google Drive triangle logo as invoices/Invoicetoolbar.js.
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

export default function SalarySlipToolbar({
  onSavePdf,
  onSaveToDrive,
  isSavingPdf,
  isSavingToDrive,
  selectedMemberId,
}) {
  return (
    <div className="no-print sticky top-0 z-30 bg-ink text-white">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        <span className="font-display text-[11px] font-700 uppercase tracking-[.2em] text-white/50">
          Salary slip generator
        </span>

        <button
          type="button"
          onClick={onSavePdf}
          disabled={isSavingPdf}
          id="btnSave"
          className="rounded bg-[#E8262A] px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-[#c81f23] focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-60"
        >
          {isSavingPdf ? "Saving…" : "Save PDF"}
        </button>

        <button
          type="button"
          onClick={onSaveToDrive}
          disabled={isSavingToDrive || !selectedMemberId}
          id="btnSaveToDrive"
          title={
            selectedMemberId
              ? "Save to Google Drive"
              : "Select a team member above to enable Drive upload"
          }
          className="flex items-center gap-2 rounded bg-[#4285F4] px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleDriveIcon />
          {isSavingToDrive ? "Uploading…" : "Save to Drive"}
        </button>
      </div>
    </div>
  );
}
