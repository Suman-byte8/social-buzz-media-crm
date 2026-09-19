"use client";
import React from "react";

const formatRupees = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

const EARNING_FIELDS = [
  { key: "basicSalary", label: "Basic Salary" },
  { key: "hra", label: "HRA" },
  { key: "otherAllowances", label: "Other Allowances" },
];

const DEDUCTION_FIELDS = [
  { key: "employeePf", label: "Employee PF" },
  { key: "professionalTax", label: "Professional Tax" },
  { key: "tds", label: "TDS" },
  { key: "otherDeductions", label: "Other Deductions" },
];

function EditableRow({ label, value, onChange }) {
  return (
    <tr className="border-b border-[#DEDBD6]">
      <td className="px-2 py-2.5">{label}</td>
      <td className="px-2 py-2.5 text-right">
        <span className="mr-1 font-mono text-[#6E6A65]">₹</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-[28mm] bg-transparent text-right font-mono text-[10.5px] outline-none"
        />
      </td>
    </tr>
  );
}

// The exact Component/Amount breakdown requested — earnings, a computed
// Gross Salary subtotal, deductions, then a computed Net/In-hand Salary row
// styled like invoices/Lineitemstable.js + Paymentandtotals.js's totals
// block so the two documents read as one system.
export default function SalaryComponentsTable({ components, onUpdateComponent, totals }) {
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
          </tr>
        </thead>
        <tbody>
          {EARNING_FIELDS.map(({ key, label }) => (
            <EditableRow
              key={key}
              label={label}
              value={components[key]}
              onChange={(value) => onUpdateComponent(key, value)}
            />
          ))}

          <tr className="border-b-2 border-[#1A1A1A] bg-[#F5F4F2] font-700">
            <td className="px-2 py-2.5">Gross Salary</td>
            <td className="px-2 py-2.5 text-right font-mono">{formatRupees(totals.gross)}</td>
          </tr>

          {DEDUCTION_FIELDS.map(({ key, label }) => (
            <EditableRow
              key={key}
              label={label}
              value={components[key]}
              onChange={(value) => onUpdateComponent(key, value)}
            />
          ))}

          <tr className="bg-[#1A1A1A] text-white">
            <td className="px-2 py-3 font-display text-[10px] font-700 uppercase tracking-[.14em]">
              Net / In-hand Salary
            </td>
            <td className="px-2 py-3 text-right font-mono text-[16px] font-600">
              {formatRupees(totals.net)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="no-print mt-2 text-[10px] text-[#6E6A65]" data-html2canvas-ignore="true">
        Click any amount to edit. Gross and Net recalculate as you type.
      </p>
    </section>
  );
}
