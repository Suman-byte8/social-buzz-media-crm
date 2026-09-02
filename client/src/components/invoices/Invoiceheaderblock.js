"use client";
import React from "react";

export default function InvoiceHeaderBlock({
  gstin,
  onGstinChange,
  invoiceNumber,
  onInvoiceNumberChange,
  issuedDate,
  onIssuedDateChange,
  dueDate,
  onDueDateChange,
  period,
  onPeriodChange,
}) {
  return (
    <header className="flex items-start justify-between gap-8 pt-3">
      <div>
        <img
          src="/images/sbm_logo.png"
          alt="Social Buzz Media"
          className="h-14 w-auto"
          onError={(e) => {
            e.target.onerror = null;
            e.target.outerHTML =
              '<div class="font-display text-[26px] font-800 uppercase leading-none tracking-tight">Social<span class="text-[#E8262A]">.</span><br><span class="text-[13px] tracking-[.34em] text-[#6E6A65]">MEDIA</span></div>';
          }}
        />
        <p className="mt-3 max-w-[62mm] text-[10.5px] leading-[1.7] text-[#6E6A65]">
          Malda, West Bengal 732101, India
          <br />
          hellosocialbuzzmedia@gmail.com
          <br />
          +91 80177 20547
          <br />
          <span className="inline-flex items-center gap-1 font-mono">
            GSTIN
            <input
              type="text"
              value={gstin}
              onChange={(e) => onGstinChange(e.target.value)}
              className="w-[32mm] bg-transparent font-mono text-[10.5px] outline-none"
            />
          </span>
        </p>
      </div>

      <div className="text-right">
        <p className="font-display text-[11px] font-700 uppercase tracking-[.32em] text-[#E8262A]">
          Tax Invoice
        </p>
        <input
          type="text"
          value={invoiceNumber}
          onChange={(e) => onInvoiceNumberChange(e.target.value)}
          className="mt-1 w-full min-w-[50mm] bg-transparent text-right font-mono text-[30px] font-600 leading-none tracking-tight outline-none"
        />

        <table className="ml-auto mt-4 text-[10.5px]">
          <tbody>
            <tr>
              <td className="pr-4 text-left uppercase tracking-[.12em] text-[#6E6A65]">
                Issued
              </td>
              <td className="text-right">
                <input
                  type="text"
                  value={issuedDate}
                  onChange={(e) => onIssuedDateChange(e.target.value)}
                  className="w-[28mm] bg-transparent text-right font-mono outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-left uppercase tracking-[.12em] text-[#6E6A65]">
                Due
              </td>
              <td className="text-right">
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => onDueDateChange(e.target.value)}
                  className="w-[28mm] bg-transparent text-right font-mono outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-left uppercase tracking-[.12em] text-[#6E6A65]">
                Period
              </td>
              <td className="text-right">
                <input
                  type="text"
                  value={period}
                  onChange={(e) => onPeriodChange(e.target.value)}
                  className="w-[28mm] bg-transparent text-right font-mono outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </header>
  );
}
