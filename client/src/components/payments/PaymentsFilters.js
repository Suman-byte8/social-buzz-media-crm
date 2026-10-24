"use client";

import React from "react";

const STATUS_OPTIONS = ["Paid", "Partially Paid", "Unpaid", "Overdue", "No Billing Configured"];

// Mirrors agreements/AgreementsFilters.js's search+dropdown markup.
export default function PaymentsFilters({ search, onSearchChange, status, onStatusChange, dateFrom, dateTo, onDateFromChange, onDateToChange }) {
  return (
    <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-outline-variant shadow-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
      <div className="relative w-full sm:max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
          placeholder="Search by client name, email, or phone..."
          type="text"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
      >
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
        <span className="text-on-surface-variant text-body-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
      </div>
    </div>
  );
}
