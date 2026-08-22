import React from "react";

export default function AgreementViewModal({ open, onClose, agreement }) {
  if (!open || !agreement) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const streamUrl = apiBase
    ? `${apiBase}/documents/${agreement.id}/stream`
    : `/api/documents/${agreement.id}/stream`;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{agreement.fileName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
          <iframe
            src={streamUrl}
            title={agreement.fileName}
            className="w-full h-[70vh]"
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
}
