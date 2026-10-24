"use client";

import React, { useState } from "react";
import { exportPaymentsReport } from "@/services/paymentService";

const REPORTS = [
  { key: "invoice-register", label: "Invoice Register" },
  { key: "client-outstanding", label: "Client Outstanding" },
  { key: "overdue-invoices", label: "Overdue Invoices" },
  { key: "collection-report", label: "Collection Report" },
  { key: "payment-method-breakdown", label: "Payment Method Breakdown" },
];

// Same blob-download pattern already used by GET /clients/export.
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PaymentsReportsPanel({ onClose }) {
  const [downloading, setDownloading] = useState(null);

  const handleExport = async (report, format) => {
    setDownloading(`${report}-${format}`);
    try {
      const blob = await exportPaymentsReport(report, { format });
      downloadBlob(blob, `${report}-${new Date().toISOString().slice(0, 10)}.${format}`);
    } catch (err) {
      window.alert(err.message || "Failed to export report");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Reports &amp; Export</h2>
        <div className="mt-4 space-y-2">
          {REPORTS.map((r) => (
            <div key={r.key} className="flex items-center justify-between rounded-md border border-outline-variant px-3 py-2.5">
              <span className="text-body-sm text-on-surface">{r.label}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleExport(r.key, "csv")}
                  disabled={downloading === `${r.key}-csv`}
                  className="rounded-md border border-outline-variant px-2.5 py-1 text-[11px] font-medium hover:bg-surface-variant disabled:opacity-50"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExport(r.key, "xlsx")}
                  disabled={downloading === `${r.key}-xlsx`}
                  className="rounded-md border border-outline-variant px-2.5 py-1 text-[11px] font-medium hover:bg-surface-variant disabled:opacity-50"
                >
                  XLSX
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
