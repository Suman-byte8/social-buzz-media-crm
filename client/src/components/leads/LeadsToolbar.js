"use client";

import React, { useRef } from "react";

export default function LeadsToolbar({ onImportFile, importing, onAddNew }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onImportFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md mb-stack-lg">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-background">Leads</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Manage and track your active sales pipeline of potential clients.
        </p>
      </div>
      <div className="flex gap-3">
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 bg-surface-container-lowest border border-on-background rounded-lg px-4 py-2 text-label-md font-label-md text-on-background hover:bg-surface-container-low transition-colors disabled:opacity-50"
          title="Import leads from a CSV (columns: companyName, contactName, email, phone, source)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {importing ? "progress_activity" : "upload"}
          </span>
          {importing ? "Importing..." : "Import"}
        </button>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 bg-primary rounded-lg px-4 py-2 text-label-md font-label-md text-white hover:bg-primary-container transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add New Lead
        </button>
      </div>
    </div>
  );
}
