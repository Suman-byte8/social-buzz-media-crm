"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionsMenu from "./ActionsMenu";
import { formatRupees } from "@/lib/formatCurrency";

const STATUS_META = {
  Paid: { color: "green" },
  "Partially Paid": { color: "amber" },
  Unpaid: { color: "gray" },
  Overdue: { color: "red" },
  "No Billing Configured": { color: "gray" },
};

const SORTABLE_COLUMNS = [
  { key: "name", label: "Client" },
  { key: "totalBilled", label: "Invoiced" },
];

const dueOf = (row) => Math.max((row.totalBilled || 0) - (row.totalCollected || 0), 0);
const advanceOf = (row) => Math.max((row.totalCollected || 0) - (row.totalBilled || 0), 0);

function SortableHeader({ column, sortBy, sortDir, onSort }) {
  const active = sortBy === column.key;
  return (
    <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
      <button type="button" onClick={() => onSort(column.key)} className="flex items-center gap-0.5 hover:text-on-surface">
        {column.label}
        <span className={`material-symbols-outlined text-[16px] ${active ? "text-primary" : "text-transparent"}`}>
          {active && sortDir === "DESC" ? "arrow_downward" : "arrow_upward"}
        </span>
      </button>
    </th>
  );
}

// Row actions are a single labeled "Actions" menu (see ActionsMenu.js)
// instead of a row of bare icon buttons — unambiguous without hovering for
// a tooltip. Invoice creation lives inside the client's own drawer
// (Invoices tab) now, not a separate quick-create here.
export default function ClientPaymentsTable({ rows, loading, sortBy, sortDir, onSort, onSelectClient, onRecordPayment, onNewInvoice }) {
  return (
    <div className="bg-white rounded-b-xl border border-outline-variant shadow-card overflow-hidden">
      <table className="w-full text-left border-collapse table-fixed">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
            {SORTABLE_COLUMNS.map((col) => (
              <SortableHeader key={col.key} column={col} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            ))}
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Received</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Due</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Advance</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-body-sm font-body-sm">
          {loading ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-secondary">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">payments</span>
                No clients match the current filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const meta = STATUS_META[row.status?.primary] || { color: "gray" };
              return (
                <tr key={row.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors">
                  <td className="py-4 px-4 overflow-hidden">
                    <button type="button" onClick={() => onSelectClient(row)} className="text-left">
                      <p className="font-title-md text-title-md text-on-surface hover:text-primary transition-colors truncate">{row.name}</p>
                      {row.contactPersonName && <p className="text-xs text-secondary truncate">{row.contactPersonName}</p>}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-on-surface whitespace-nowrap">{formatRupees(row.totalBilled)}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-emerald-700">{formatRupees(row.totalCollected)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={dueOf(row) > 0 ? "text-red-700 font-medium" : "text-secondary"}>{formatRupees(dueOf(row))}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={advanceOf(row) > 0 ? "text-indigo-700 font-medium" : "text-secondary"}>{formatRupees(advanceOf(row))}</span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={row.status?.primary} color={meta.color} showDot />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <ActionsMenu
                      items={[
                        { label: "View Details", icon: "visibility", onClick: () => onSelectClient(row) },
                        { label: "Record Payment", icon: "add_card", onClick: () => onRecordPayment(row) },
                        { label: "New Invoice", icon: "receipt_long", onClick: () => onNewInvoice(row) },
                      ]}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
