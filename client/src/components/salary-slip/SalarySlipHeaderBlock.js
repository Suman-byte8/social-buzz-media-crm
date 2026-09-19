"use client";
import React from "react";

// Same layout/copy pattern as invoices/Invoiceheaderblock.js — reuses the
// exact same agency logo image/fallback so the two documents read as one
// consistent system.
export default function SalarySlipHeaderBlock({
  slipNumber,
  onSlipNumberChange,
  issuedDate,
  onIssuedDateChange,
  payDate,
  onPayDateChange,
  payPeriod,
  onPayPeriodChange,
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
        </p>
      </div>

      <div className="text-right">
        <p className="font-display text-[11px] font-700 uppercase tracking-[.32em] text-[#E8262A]">
          Salary Slip
        </p>
        <input
          type="text"
          value={slipNumber}
          onChange={(e) => onSlipNumberChange(e.target.value)}
          className="mt-1 w-full min-w-[50mm] bg-transparent text-right font-mono text-[30px] font-600 leading-none tracking-tight outline-none"
        />

        <table className="ml-auto mt-4 text-[10.5px]">
          <tbody>
            <tr>
              <td className="pr-4 text-left uppercase tracking-[.12em] text-[#6E6A65]">
                Pay Period
              </td>
              <td className="text-right">
                <input
                  type="text"
                  value={payPeriod}
                  onChange={(e) => onPayPeriodChange(e.target.value)}
                  className="w-[28mm] bg-transparent text-right font-mono outline-none"
                />
              </td>
            </tr>
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
                Pay Date
              </td>
              <td className="text-right">
                <input
                  type="text"
                  value={payDate}
                  onChange={(e) => onPayDateChange(e.target.value)}
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
