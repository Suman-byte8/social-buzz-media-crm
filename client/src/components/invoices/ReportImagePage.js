"use client";
import React, { forwardRef } from "react";

// One A4 "sheet" of pasted screenshots/metrics images, laid out into
// justified rows by imageGridLayout.js. Same physical size/chrome as the
// invoice sheet (Invoicedocument.js) so it reads as the next page of the
// same document rather than a bolted-on attachment.
const ReportImagePage = forwardRef(function ReportImagePage({ rows, pageNumber, totalPages, onRemoveImage }, ref) {
  return (
    <article
      ref={ref}
      className="sheet relative mx-auto w-[210mm] min-h-[297mm] shrink-0 bg-white p-[14mm] shadow-[0_18px_50px_rgba(26,26,26,.16)]"
    >
      <div className="absolute inset-x-0 top-0 h-[5px] bg-[#E8262A]"></div>

      <div className="mb-4 flex items-center justify-between border-b border-[#EDEBE8] pb-3">
        <h2 className="font-display text-[13px] font-700 uppercase tracking-[.18em] text-ink">Performance Report</h2>
        <span className="font-body text-[11px] text-[#6E6A65]">
          Page {pageNumber} of {totalPages}
        </span>
      </div>

      <div className="flex flex-col overflow-hidden" style={{ gap: "4mm" }}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center justify-center"
            style={{ gap: "4mm", height: `${row.height}mm` }}
          >
            {row.items.map((item) => (
              <div
                key={item.id}
                className="group relative shrink-0"
                style={{ width: `${item.width}mm`, height: `${item.height}mm` }}
              >
                <img
                  src={item.src}
                  alt=""
                  className="rounded-sm object-contain"
                  style={{ width: `${item.width}mm`, height: `${item.height}mm` }}
                />
                {onRemoveImage && (
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={() => onRemoveImage(item.id)}
                    title="Remove image"
                    className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow-md hover:bg-[#E8262A] group-hover:flex"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="absolute bottom-[10mm] left-0 right-0 text-center font-display text-[8.5px] uppercase tracking-[.28em] text-[#6E6A65]">
        socialbuzzmedia.in &middot; Performance Report
      </p>
    </article>
  );
});

export default ReportImagePage;
