"use client";

import React from "react";

export default function AgreementsToolbar({ onUpload }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Agreements</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Track signed contracts, renewal windows, and pending signatures across every client.
        </p>
      </div>
      <button
        onClick={onUpload}
        className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-card flex items-center gap-2 self-start md:self-auto"
      >
        <span className="material-symbols-outlined text-[18px]">upload_file</span>
        Upload Agreement
      </button>
    </div>
  );
}
