"use client";
import React, { useRef } from "react";

// Sits between the invoice sheet and the generated report pages. Not part
// of any captured node (html2canvas only ever captures the individual
// .sheet <article> elements), so nothing here needs data-html2canvas-ignore
// to stay out of the exported PDF — it simply never is one of the nodes
// captured.
export default function ReportPagesEditor({ onAddFiles, imageCount, error }) {
  const fileInputRef = useRef(null);

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
          <p className="font-display text-[12px] font-700 uppercase tracking-[.14em] text-ink">Performance Report Pages</p>
          <p className="mt-0.5 text-[12px] text-[#6E6A65]">
            {imageCount > 0
              ? `${imageCount} image${imageCount === 1 ? "" : "s"} added — paste or upload more any time. Pages are generated automatically as they fill up.`
              : "Paste screenshots (analytics, metrics, results) below, or upload image files — any size or aspect ratio. Pages fill automatically and a new one starts once a page is full."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
