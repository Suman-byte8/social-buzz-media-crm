"use client";
import React, { useRef } from "react";

// Sits between the invoice sheet and the generated report pages. Not part
// of any captured node (html2canvas only ever captures the individual
// .sheet <article> elements), so nothing here needs data-html2canvas-ignore
// to stay out of the exported PDF — it simply never is one of the nodes
// captured.
export default function ReportPagesEditor({ layoutMode, onLayoutModeChange, onAddFiles, onAddPage, imageCount, error }) {
  const fileInputRef = useRef(null);
  const isFreeform = layoutMode === "freeform";

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      onAddFiles(files);
    }
  };

  return (
    <div className="no-print mx-auto mt-6 w-[210mm]">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[#C9C5BF] bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-[12px] font-700 uppercase tracking-[.14em] text-ink">Performance Report Pages</p>
            <div className="flex rounded-full border border-[#DEDBD6] bg-white p-0.5 text-[10px] font-semibold uppercase tracking-wide">
              <button
                type="button"
                onClick={() => onLayoutModeChange("auto")}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  !isFreeform ? "bg-ink text-white" : "text-[#6E6A65] hover:text-ink"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => onLayoutModeChange("freeform")}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  isFreeform ? "bg-ink text-white" : "text-[#6E6A65] hover:text-ink"
                }`}
              >
                Freeform
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-[12px] text-[#6E6A65]">
            {isFreeform
              ? imageCount > 0
                ? "Drag any image to move it, the corner handle to resize, or the top handle to rotate it — full creative control over the layout."
                : "Paste or upload screenshots — each lands as a draggable, resizable, rotatable photo you arrange however you like."
              : imageCount > 0
              ? `${imageCount} image${imageCount === 1 ? "" : "s"} added — paste or upload more any time. Pages are generated automatically as they fill up.`
              : "Paste screenshots (analytics, metrics, results) below, or upload image files — any size or aspect ratio. Pages fill automatically and a new one starts once a page is full."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isFreeform && (
            <button
              type="button"
              onClick={onAddPage}
              className="whitespace-nowrap rounded border border-[#DEDBD6] bg-white px-3 py-2 text-[12px] font-semibold text-ink hover:border-[#E8262A] hover:text-[#E8262A]"
            >
              + Add page
            </button>
          )}
          <div
            tabIndex={0}
            onPaste={handlePaste}
            className="flex h-9 items-center whitespace-nowrap rounded border border-[#C9C5BF] bg-white px-3 text-[12px] text-[#6E6A65] focus:outline-none focus:ring-2 focus:ring-[#E8262A]/40"
          >
            Click here, then Ctrl+V
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="whitespace-nowrap rounded bg-ink px-3 py-2 text-[12px] font-semibold text-white hover:bg-ink/90"
          >
            + Upload images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
