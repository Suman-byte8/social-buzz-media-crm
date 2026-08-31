"use client";

import React from "react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "hot", label: "Hot" },
  { value: "lost", label: "Lost" },
];

export default function LeadsFilters({ search, onSearchChange, status, onStatusChange, source, onSourceChange, sources = [] }) {
  return (
    <div className="p-card-padding border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center gap-stack-md bg-[#FAFAFA] rounded-t-xl">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-lg text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
            placeholder="Search by name, company..."
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full border font-label-sm text-label-sm transition-colors ${
              status === opt.value
                ? "border-primary bg-surface-container-low text-primary"
                : "border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {sources.length > 0 && (
          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low font-label-sm text-label-sm transition-colors outline-none"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
