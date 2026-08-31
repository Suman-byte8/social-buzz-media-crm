"use client";

import React from "react";

export default function MiscTaskToolbar({ onAddRow, onAddRows }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Miscellaneous</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Track one-off creative work — banners, videos, and OOH — that doesn&apos;t fit the content calendar.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        <button
          onClick={onAddRow}
          className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-card flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Row
        </button>
        <button
          onClick={() => onAddRows(5)}
          className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-label-md text-label-md hover:bg-primary/20 transition-colors"
          title="Add 5 rows at once"
        >
          +5
        </button>
      </div>
    </div>
  );
}
