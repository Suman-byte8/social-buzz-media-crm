"use client";
import React, { useState } from "react";

const STATUS_STYLE = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  generating: { label: "Generating", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm hover:bg-surface-variant ${danger ? "text-red-600" : "text-on-surface"}`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </button>
  );
}

export default function ReportCard({ report, view, isTrashView, onOpen, onDuplicate, onRename, onExport, onDownload, onTrash, onRestore, onPermanentDelete }) {
  const status = STATUS_STYLE[report.status] || STATUS_STYLE.draft;
  const [menuOpen, setMenuOpen] = useState(false);
  const isList = view === "list";

  return (
    <div className={`group relative rounded-xl border border-outline-variant bg-white shadow-sm transition-shadow hover:shadow-md ${isList ? "flex items-center gap-4 p-4" : "flex flex-col p-4"}`}>
      <button type="button" onClick={onOpen} className={`min-w-0 text-left ${isList ? "flex flex-1 items-center gap-4" : "flex-1"}`}>
        <div className={`flex shrink-0 items-center justify-center rounded-lg bg-surface-variant text-on-surface-variant ${isList ? "h-14 w-14" : "mb-3 h-28 w-full"}`}>
          <span className="material-symbols-outlined text-[28px]">description</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-title-md text-title-md text-on-surface">{report.title}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">{report.client?.name || "Unknown client"}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {report.createdBy ? `By ${report.createdBy} · ` : ""}
            {new Date(report.updatedAt).toLocaleDateString()}
          </p>
          {report.status === "failed" && report.lastExportError && (
            <p className="mt-1 truncate text-[11px] text-red-600" title={report.lastExportError}>
              {report.lastExportError}
            </p>
          )}
        </div>
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((p) => !p);
          }}
          className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined text-[18px]">more_vert</span>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
              {!isTrashView ? (
                <>
                  <MenuItem icon="edit" label="Open / Edit" onClick={() => { setMenuOpen(false); onOpen(); }} />
                  <MenuItem icon="content_copy" label="Duplicate" onClick={() => { setMenuOpen(false); onDuplicate(); }} />
                  <MenuItem icon="drive_file_rename_outline" label="Rename" onClick={() => { setMenuOpen(false); onRename(); }} />
                  <MenuItem icon="picture_as_pdf" label="Export PDF" onClick={() => { setMenuOpen(false); onExport(); }} />
                  {report.driveWebViewLink && <MenuItem icon="download" label="Download latest" onClick={() => { setMenuOpen(false); onDownload(); }} />}
                  <MenuItem icon="delete" label="Move to trash" danger onClick={() => { setMenuOpen(false); onTrash(); }} />
                </>
              ) : (
                <>
                  <MenuItem icon="restore" label="Restore" onClick={() => { setMenuOpen(false); onRestore(); }} />
                  <MenuItem icon="delete_forever" label="Delete permanently" danger onClick={() => { setMenuOpen(false); onPermanentDelete(); }} />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
