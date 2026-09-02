"use client";

import React from "react";

export default function MonthTabBar({
  months = [],
  selectedMonth,
  onSelectMonth,
  totalEntriesCount = 0,
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-200">
      <button
        type="button"
        onClick={() => onSelectMonth("")}
        className={`px-3 py-1.5 rounded-t-lg font-label-sm text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
          !selectedMonth
            ? "border-primary text-primary bg-primary/5 shadow-xs"
            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
        All Months
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            !selectedMonth ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {totalEntriesCount}
        </span>
      </button>

      {months.map((m) => {
        const isActive = selectedMonth === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelectMonth(m.key)}
            className={`px-3 py-1.5 rounded-t-lg font-label-sm text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              isActive
                ? "border-primary text-primary bg-primary/5 shadow-xs"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {m.label}
            {m.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {m.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
