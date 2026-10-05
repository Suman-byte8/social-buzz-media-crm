"use client";
import React, { forwardRef, useRef } from "react";
import ReportImageTile from "./ReportImageTile";
import { PAGE_CONTENT_HEIGHT_MM } from "../../lib/customReportLayout";

// One A4 "sheet" of freely-arranged screenshots — the Freeform counterpart
// to ReportImagePage.js's auto-packed grid. Same physical size/chrome so it
// reads as the next page of the same document.
const CustomReportPage = forwardRef(function CustomReportPage(
  {
    tiles,
    pageNumber,
    totalPages,
    isActive,
    onActivate,
    onUpdateTile,
    onRemoveTile,
    onBringToFront,
    onShuffle,
    onTidy,
    onRemovePage,
  },
  ref
) {
  const contentRef = useRef(null);

  return (
    <article
      ref={ref}
      onPointerDownCapture={onActivate}
      className="sheet relative mx-auto w-[210mm] min-h-[297mm] shrink-0 bg-white p-[14mm] shadow-[0_18px_50px_rgba(26,26,26,.16)]"
    >
      {/* The "this is where new pastes land" ring is purely an editing aid —
          kept as a separate ignored overlay rather than a class on the
          captured <article> root itself, so it never gets baked into the
          exported PDF for whichever page happened to be active at export
          time. */}
      {isActive && (
        <div
          data-html2canvas-ignore="true"
          className="no-print pointer-events-none absolute inset-0 rounded-sm ring-2 ring-[#E8262A] ring-offset-2 ring-offset-[#EAE8E4]"
        />
      )}

      <div className="absolute inset-x-0 top-0 h-[5px] bg-[#E8262A]"></div>

      <div className="mb-4 flex items-center justify-between border-b border-[#EDEBE8] pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[13px] font-700 uppercase tracking-[.18em] text-ink">Performance Report</h2>
          {isActive && (
            <span
              data-html2canvas-ignore="true"
              className="no-print rounded-full bg-[#E8262A]/10 px-2 py-0.5 font-display text-[9px] font-700 uppercase tracking-[.1em] text-[#E8262A]"
            >
              Active — new pastes land here
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div data-html2canvas-ignore="true" className="no-print flex items-center gap-1.5">
            <button
              type="button"
              onClick={onShuffle}
              title="Scatter into a fresh creative layout"
              className="rounded border border-[#DEDBD6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6E6A65] hover:border-[#E8262A] hover:text-[#E8262A]"
            >
              Shuffle
            </button>
            <button
              type="button"
              onClick={onTidy}
              title="Snap back into a clean grid"
              className="rounded border border-[#DEDBD6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6E6A65] hover:border-[#E8262A] hover:text-[#E8262A]"
            >
              Tidy
            </button>
            <button
              type="button"
              onClick={onRemovePage}
              title="Remove this page"
              className="rounded border border-[#DEDBD6] p-1 text-[#6E6A65] hover:border-red-400 hover:text-red-600"
            >
              <span className="material-symbols-outlined block text-[14px]">delete</span>
            </button>
          </div>
          <span className="font-body text-[11px] text-[#6E6A65]">
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      </div>

      <div ref={contentRef} className="relative overflow-hidden" style={{ height: `${PAGE_CONTENT_HEIGHT_MM}mm` }}>
        {tiles.length === 0 ? (
          <div
            data-html2canvas-ignore="true"
            className="no-print flex h-full items-center justify-center rounded border border-dashed border-[#DEDBD6] px-8 text-center text-[12px] text-[#6E6A65]"
          >
            {isActive
              ? "Paste or upload a screenshot — it'll land here, ready to drag, resize, or rotate into place."
              : "Click this page to make it active, then paste a screenshot."}
          </div>
        ) : (
          tiles.map((tile) => (
            <ReportImageTile
              key={tile.id}
              tile={tile}
              pageContentRef={contentRef}
              onUpdate={(patch) => onUpdateTile(tile.id, patch)}
              onRemove={() => onRemoveTile(tile.id)}
              onFocus={() => onBringToFront(tile.id)}
            />
          ))
        )}
      </div>

      <p className="absolute bottom-[10mm] left-0 right-0 text-center font-display text-[8.5px] uppercase tracking-[.28em] text-[#6E6A65]">
        socialbuzzmedia.in &middot; Performance Report
      </p>
    </article>
  );
});

export default CustomReportPage;
