"use client";

import React from "react";

export default function ClientsToolbar({ onExport, onAddClient }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-stack-lg gap-4">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface">Clients</h2>
        <p className="font-body-sm text-body-sm text-secondary mt-1">Manage your agency accounts and monitor health scores.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-white border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-gray-50 transition-colors shadow-card"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export
        </button>
        <button
          onClick={onAddClient}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-card"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Client
        </button>
      </div>
    </div>
  );
}
