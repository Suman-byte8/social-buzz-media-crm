"use client";

import React from "react";

export default function AgreementViewModal({ open, onClose, agreement }) {
  if (!open || !agreement) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const streamUrl = apiBase ? `${apiBase}/documents/${agreement.id}/stream` : `/api/documents/${agreement.id}/stream`;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 p-6 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-on-surface truncate pr-4">{agreement.fileName}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1 shrink-0" title="Close">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <div className="flex-1 border border-outline-variant rounded-lg overflow-hidden bg-gray-50">
          <iframe src={streamUrl} title={agreement.fileName} className="w-full h-[70vh]" />
        </div>
      </div>
    </div>
  );
}
