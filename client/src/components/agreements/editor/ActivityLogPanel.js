"use client";
import React, { useEffect, useState } from "react";

const ACTION_LABEL = {
  created: "Created",
  edited: "Edited",
  exported: "Exported (PDF/DOCX saved to Drive)",
  finalized: "Finalized",
  status_changed: "Status changed",
  signed_copy_uploaded: "Signed copy uploaded",
  version_restored: "Version restored",
};

function describe(log) {
  if (log.action === "status_changed" && log.metadata) {
    return `${ACTION_LABEL.status_changed}: ${log.metadata.from} → ${log.metadata.to}`;
  }
  if (log.action === "version_restored" && log.metadata) {
    return `Restored version ${log.metadata.versionNumber}`;
  }
  return ACTION_LABEL[log.action] || log.action;
}

// A read-only audit trail — who did what, when. No edit/delete affordance
// anywhere, by design (an audit log that can be altered isn't one).
export default function ActivityLogPanel({ open, onClose, loadActivity }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        setLogs(await loadActivity());
      } finally {
        setLoading(false);
      }
    })();
  }, [open, loadActivity]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Activity</h2>
        {loading ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">No activity recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-primary">history</span>
                <div>
                  <p className="text-body-sm text-on-surface">{describe(log)}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {new Date(log.createdAt).toLocaleString()} {log.userName ? `· ${log.userName}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-md border border-outline-variant py-2 text-body-sm hover:bg-surface-variant">
          Close
        </button>
      </div>
    </div>
  );
}
