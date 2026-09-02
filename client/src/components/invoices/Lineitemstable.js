"use client";
import React from "react";

const formatRupees = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function LineItemsTable({ rows, onUpdateRow, onRemoveRow, services = [] }) {
  return (
    <section className="mt-7">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-[#1A1A1A] text-white">
            <th className="w-[10mm] px-2 py-2.5 text-left font-display text-[9px] font-700 uppercase tracking-[.18em]">
              #
            </th>
            <th className="px-2 py-2.5 text-left font-display text-[9px] font-700 uppercase tracking-[.18em]">
              Description
            </th>
            <th className="w-[16mm] px-2 py-2.5 text-right font-display text-[9px] font-700 uppercase tracking-[.18em]">
              Qty
            </th>
            <th className="w-[26mm] px-2 py-2.5 text-right font-display text-[9px] font-700 uppercase tracking-[.18em]">
              Rate
            </th>
            <th className="w-[30mm] px-2 py-2.5 text-right font-display text-[9px] font-700 uppercase tracking-[.18em]">
              Amount
            </th>
            <th className="no-print w-[8mm]" data-html2canvas-ignore="true"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-[#DEDBD6] align-top">
              <td className="px-2 py-2.5 font-mono text-[#6E6A65]">
                {String(i + 1).padStart(2, "0")}
              </td>
              <td className="px-2 py-2.5">
                <select
                  value={r.desc}
                  onChange={(e) => onUpdateRow(r.id, "desc", e.target.value)}
                  disabled={services.length === 0}
                  className="w-full bg-transparent leading-snug outline-none disabled:text-[#B8B4AF]"
                >
                  <option value="">
                    {services.length === 0 ? "Select a client to load services" : "Select a service…"}
                  </option>
                  {services.map((s) => (
                    <option key={s} value={s} className="text-black bg-white">
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-2.5 text-right">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={r.qty}
                  onChange={(e) => onUpdateRow(r.id, "qty", parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-right font-mono text-[10.5px] outline-none"
                />
              </td>
              <td className="px-2 py-2.5 text-right">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={r.rate}
                  onChange={(e) => onUpdateRow(r.id, "rate", parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-right font-mono text-[10.5px] outline-none"
                />
              </td>
              <td className="px-2 py-2.5 text-right font-mono">
                {formatRupees((r.qty || 0) * (r.rate || 0))}
              </td>
              <td className="no-print px-1 py-2.5 text-right" data-html2canvas-ignore="true">
                <button
                  type="button"
                  onClick={() => onRemoveRow(r.id)}
                  className="rounded px-1 text-[#6E6A65] hover:bg-[#FDECEC] hover:text-[#E8262A] focus:outline-none focus:ring-2 focus:ring-[#E8262A]"
                  aria-label="Remove line item"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-2 py-6 text-center text-[#6E6A65]">
                No line items yet — click &ldquo;+ Add line item&rdquo; above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="no-print mt-2 text-[10px] text-[#6E6A65]" data-html2canvas-ignore="true">
        Click any field to edit. Amounts recalculate as you type.
      </p>
    </section>
  );
}