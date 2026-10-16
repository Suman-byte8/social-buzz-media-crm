"use client";

import React from "react";

// Mirrors agreements/AgreementsToolbar.js.
export default function ProposalsToolbar({ onUpload, onGenerate }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Proposals</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Track proposals sent to every client, generated or uploaded.
        </p>
      </div>
      <div className="flex gap-2 self-start md:self-auto">
        <button
          onClick={onGenerate}
          className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-card flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Generate Proposal
        </button>
        <button
          onClick={onUpload}
          className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload Proposal
        </button>
      </div>
    </div>
  );
}
