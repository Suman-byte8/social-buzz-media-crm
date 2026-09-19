"use client";
import React from "react";

const formatRupees = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

// Same add/remove/editable-text pattern as invoices/Lineitemstable.js: each
// row's label and amount are both plain inputs, a row can be removed, and a
// new one can be added — none of that (remove buttons, add-row buttons)
// prints or exports to the PDF, same reasoning as the invoice table.
function EditableRow({ row, onUpdateRow, onRemoveRow }) {
  return (
    <tr className="border-b border-[#DEDBD6]">
      <td className="px-2 py-2.5">
        <input
          type="text"
          value={row.label}
          onChange={(e) => onUpdateRow(row.id, "label", e.target.value)}
          placeholder="Component name…"
          className="w-full bg-transparent outline-none"
        />
      </td>
      <td className="px-2 py-2.5 text-right">
        <span className="mr-1 font-mono text-[#6E6A65]">₹</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={row.amount}
          onChange={(e) => onUpdateRow(row.id, "amount", parseFloat(e.target.value) || 0)}
          className="w-[28mm] bg-transparent text-right font-mono text-[10.5px] outline-none"
        />
      </td>
      <td className="no-print px-1 py-2.5 text-right" data-html2canvas-ignore="true">
        <button
          type="button"
          onClick={() => onRemoveRow(row.id)}
          className="rounded px-1 text-[#6E6A65] hover:bg-[#FDECEC] hover:text-[#E8262A] focus:outline-none focus:ring-2 focus:ring-[#E8262A]"
          aria-label="Remove component"
        >
          ×
        </button>
      </td>
    </tr>
  );
}

function AddRowRow({ label, onAdd }) {
  return (
    <tr className="no-print" data-html2canvas-ignore="true">
      <td colSpan={3} className="px-2 py-1.5">
        <button
          type="button"
          onClick={onAdd}
          className="rounded border border-[#DEDBD6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6E6A65] hover:border-[#E8262A] hover:text-[#E8262A]"
        >
          + {label}
        </button>
      </td>
    </tr>
  );
}

// The Component/Amount breakdown requested — earnings, a computed Gross
// Salary subtotal, deductions, then a computed Net/In-hand Salary row,
// styled like invoices/Lineitemstable.js + Paymentandtotals.js's totals
// block so the two documents read as one system.
export default function SalaryComponentsTable({
  earningRows,
  deductionRows,
  onAddEarningRow,
  onUpdateEarningRow,
  onRemoveEarningRow,
  onAddDeductionRow,
  onUpdateDeductionRow,
  onRemoveDeductionRow,
  totals,
}) {
  return (
    <section className="mt-7">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-[#1A1A1A] text-white">
            <th className="px-2 py-2.5 text-left font-display text-[9px] font-700 uppercase tracking-[.18em]">
              Component
            </th>
            <th className="w-[40mm] px-2 py-2.5 text-right font-display text-[9px] font-700 uppercase tracking-[.18em]">
              Amount
            </th>
            <th className="no-print w-[8mm]" data-html2canvas-ignore="true"></th>
          </tr>
        </thead>
        <tbody>
          {earningRows.map((row) => (
            <EditableRow key={row.id} row={row} onUpdateRow={onUpdateEarningRow} onRemoveRow={onRemoveEarningRow} />
          ))}
          <AddRowRow label="Add earning" onAdd={onAddEarningRow} />

          <tr className="border-b-2 border-[#1A1A1A] bg-[#F5F4F2] font-700">
            <td className="px-2 py-2.5">Gross Salary</td>
            <td className="px-2 py-2.5 text-right font-mono">{formatRupees(totals.gross)}</td>
            <td className="no-print" data-html2canvas-ignore="true"></td>
          </tr>

          {deductionRows.map((row) => (
            <EditableRow key={row.id} row={row} onUpdateRow={onUpdateDeductionRow} onRemoveRow={onRemoveDeductionRow} />
          ))}
          <AddRowRow label="Add deduction" onAdd={onAddDeductionRow} />

          <tr className="bg-[#1A1A1A] text-white">
            <td className="px-2 py-3 font-display text-[10px] font-700 uppercase tracking-[.14em]">
              Net / In-hand Salary
            </td>
            <td className="px-2 py-3 text-right font-mono text-[16px] font-600">
              {formatRupees(totals.net)}
            </td>
            <td className="no-print" data-html2canvas-ignore="true"></td>
          </tr>
        </tbody>
      </table>
      <p className="no-print mt-2 text-[10px] text-[#6E6A65]" data-html2canvas-ignore="true">
        Click any name or amount to edit. Add or remove rows as needed — Gross and Net recalculate automatically.
      </p>
    </section>
  );
}
