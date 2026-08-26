"use client";

import React from "react";

const Row = ({ label, value, mono, uppercase }) => (
  <div className="flex items-center justify-between gap-3">
    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider shrink-0">{label}</p>
    <p className={`font-body-md text-body-md text-on-surface font-medium text-right truncate ${mono ? "font-mono" : ""} ${uppercase ? "uppercase" : ""}`}>
      {value}
    </p>
  </div>
);

export default function BankDetailsCard({ bankObj, member }) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-card">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">account_balance</span>
        Bank Details
      </h2>

      <div className="space-y-4">
        <Row label="Account Holder" value={bankObj.accountHolderName || member.name || "N/A"} />
        <Row label="Bank Name" value={bankObj.bankName || "Not provided"} />
        <Row label="Account Number" value={bankObj.accountNumber || "Not provided"} mono />
        <Row label="IFSC Code" value={bankObj.ifscCode || "Not provided"} mono uppercase />
        {bankObj.upiId && <Row label="UPI ID" value={bankObj.upiId} mono />}
      </div>
    </div>
  );
}
