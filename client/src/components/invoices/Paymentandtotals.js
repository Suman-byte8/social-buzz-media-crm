"use client";
import React from "react";

const formatRupees = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function PaymentAndTotals({
  bankDetails,
  onBankDetailsChange,
  totals,
  amountInWords,
  advancePaid,
  onAdvancePaidChange,
  balance,
}) {
  const { subtotal, discount, taxable, cgst, sgst, igst, gstMode, roundAmt, grand } = totals;

  const updateBank = (field, value) => {
    onBankDetailsChange({ ...bankDetails, [field]: value });
  };

  return (
    <section className="mt-8 grid grid-cols-[1fr_78mm] gap-8">
      <div>
        <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
          Payment details
        </p>
        <table className="mt-2 text-[10.5px] leading-[1.85]">
          <tbody>
            <tr>
              <td className="pr-4 text-[#6E6A65]">Account name</td>
              <td>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => updateBank("accountName", e.target.value)}
                  className="bg-transparent outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-[#6E6A65]">Account no.</td>
              <td>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => updateBank("accountNumber", e.target.value)}
                  className="bg-transparent font-mono outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-[#6E6A65]">IFSC</td>
              <td>
                <input
                  type="text"
                  value={bankDetails.ifsc}
                  onChange={(e) => updateBank("ifsc", e.target.value)}
                  className="bg-transparent font-mono outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-[#6E6A65]">Bank</td>
              <td>
                <input
                  type="text"
                  value={bankDetails.bank}
                  onChange={(e) => updateBank("bank", e.target.value)}
                  className="bg-transparent outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-[#6E6A65]">UPI</td>
              <td>
                <input
                  type="text"
                  value={bankDetails.upi}
                  onChange={(e) => updateBank("upi", e.target.value)}
                  className="bg-transparent font-mono outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 border-l-[3px] border-[#E8262A] bg-[#F5F4F2] px-3 py-2.5">
          <p className="font-display text-[9px] font-700 uppercase tracking-[.2em] text-[#6E6A65]">
            Amount in words
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-snug">{amountInWords}</p>
        </div>
      </div>

      <div>
        <table className="w-full text-[11px]">
          <tbody className="[&_td]:py-[5px]">
            <tr>
              <td className="text-[#6E6A65]">Subtotal</td>
              <td className="text-right font-mono">{formatRupees(subtotal)}</td>
            </tr>
            <tr>
              <td className="text-[#6E6A65]">Discount</td>
              <td className="text-right font-mono">{formatRupees(discount)}</td>
            </tr>
            <tr className="border-t border-[#DEDBD6]">
              <td className="text-[#6E6A65]">Taxable value</td>
              <td className="text-right font-mono">{formatRupees(taxable)}</td>
            </tr>

            {gstMode === "intra" && (
              <>
                <tr>
                  <td className="text-[#6E6A65]">CGST</td>
                  <td className="text-right font-mono">{formatRupees(cgst)}</td>
                </tr>
                <tr>
                  <td className="text-[#6E6A65]">SGST</td>
                  <td className="text-right font-mono">{formatRupees(sgst)}</td>
                </tr>
              </>
            )}

            {gstMode === "inter" && (
              <tr>
                <td className="text-[#6E6A65]">IGST</td>
                <td className="text-right font-mono">{formatRupees(igst)}</td>
              </tr>
            )}

            <tr>
              <td className="text-[#6E6A65]">Round off</td>
              <td className="text-right font-mono">{formatRupees(roundAmt)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2 bg-[#1A1A1A] px-3 py-3 text-white">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[9.5px] font-700 uppercase tracking-[.2em] text-white/60">
              Total due
            </span>
            <span className="font-mono text-[22px] font-600 leading-none">
              {formatRupees(grand)}
            </span>
          </div>
        </div>

        <table className="mt-2 w-full text-[11px]">
          <tbody className="[&_td]:py-[5px]">
            <tr>
              <td className="text-[#6E6A65]">Advance received</td>
              <td className="text-right">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={advancePaid}
                  onChange={(e) => onAdvancePaidChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-right font-mono text-[10.5px] outline-none"
                />
              </td>
            </tr>
            <tr className="border-t border-[#DEDBD6]">
              <td className="font-semibold text-[#E8262A]">Balance payable</td>
              <td className="text-right font-mono font-semibold text-[#E8262A]">
                {formatRupees(balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}