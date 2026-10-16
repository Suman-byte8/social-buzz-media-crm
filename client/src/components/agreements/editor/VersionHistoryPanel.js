"use client";
import React, { useEffect, useState } from "react";

// A simple read-only list + restore action — no diff/compare view this
// pass (see the Agreement Generator plan's explicitly-deferred items).
export default function VersionHistoryPanel({ open, onClose, loadVersions, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        setVersions(await loadVersions());
      } finally {
        setLoading(false);
      }
    })();
  }, [open, loadVersions]);

  if (!open) return null;

  const handleRestore = async (versionId) => {
    if (!window.confirm("Restore this version? Your current unsaved edits in the editor will be replaced.")) return;
    setRestoringId(versionId);
    try {
      await onRestore(versionId);
      onClose();
    } catch (err) {
      window.alert(err.message || "Failed to restore this version");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Version history</h2>
        {loading ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">No saved versions yet — versions are created when you finalize the agreement.</p>
        ) : (
          <ul className="mt-4 divide-y divide-outline-variant">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Version {v.versionNumber}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {new Date(v.createdAt).toLocaleString()} {v.savedBy ? `· ${v.savedBy}` : ""}
                  </p>
                  {v.note && <p className="mt-0.5 text-[11px] text-on-surface-variant">{v.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(v.id)}
                  disabled={restoringId === v.id}
                  className="rounded-md border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {restoringId === v.id ? "Restoring…" : "Restore"}
                </button>
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
