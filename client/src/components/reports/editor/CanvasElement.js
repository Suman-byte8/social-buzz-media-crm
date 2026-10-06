"use client";
import React, { useRef } from "react";
import { clamp } from "@/lib/customReportLayout";

const MIN_SIZE_MM = 10;

// Shared move/resize/rotate/select chrome for every element type (text,
// image, shape, table, kpi) — the content inside (passed as children) is
// the only part that differs per type. Same pointer-event drag pattern as
// ReportImageTile.js (the invoice Freeform feature): convert pointer-pixel
// deltas to mm via the page's live rendered width so it's zoom/resolution
// independent, track on `document` during the gesture, and only push one
// undo-history entry per whole gesture (onCommitHistory, called on
// pointerup) rather than one per pointermove frame (onUpdate uses
// skipHistory:true for every intermediate frame).
//
// Resizing is aspect-locked only for images (never cropped/stretched,
// same rule the invoice's report pages follow) — every other type resizes
// freely since that's how a text box, shape, table, or KPI card is
// expected to behave.
export default function CanvasElement({
  element,
  pageWidthMm,
  pageHeightMm,
  pageContentRef,
  isSelected,
  onSelect,
  onUpdate,
  onCommitHistory,
  onRemove,
  children,
}) {
  const elRef = useRef(null);

  const getPxPerMm = () => {
    const rect = pageContentRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? rect.width / pageWidthMm : 1;
  };

  const trackDrag = (onMove) => {
    const handleUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", handleUp);
      onCommitHistory();
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", handleUp);
  };

  const handleMoveStart = (e) => {
    // Lets clicks inside an actively-editing text/table cell place a caret
    // normally instead of starting a drag — see TextElementContent.js /
    // TableElementContent.js for what sets this attribute.
    if (e.target.closest("[data-no-drag]")) return;
    e.preventDefault();
    onSelect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = element.x;
    const startY = element.y;
    const pxPerMm = getPxPerMm();

    trackDrag((ev) => {
      const dxMm = (ev.clientX - startClientX) / pxPerMm;
      const dyMm = (ev.clientY - startClientY) / pxPerMm;
      onUpdate(
        {
          x: clamp(startX + dxMm, 0, Math.max(0, pageWidthMm - element.width)),
          y: clamp(startY + dyMm, 0, Math.max(0, pageHeightMm - element.height)),
        },
        { skipHistory: true }
      );
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const pxPerMm = getPxPerMm();
    const lockAspect = element.type === "image";
    const aspect = startWidth / startHeight;

    trackDrag((ev) => {
      const dxMm = (ev.clientX - startClientX) / pxPerMm;
      let newWidth = clamp(startWidth + dxMm, MIN_SIZE_MM, pageWidthMm - element.x);
      let newHeight;
      if (lockAspect) {
        newHeight = newWidth / aspect;
        if (element.y + newHeight > pageHeightMm) {
          newHeight = pageHeightMm - element.y;
          newWidth = newHeight * aspect;
        }
      } else {
        const dyMm = (ev.clientY - startClientY) / pxPerMm;
        newHeight = clamp(startHeight + dyMm, MIN_SIZE_MM, pageHeightMm - element.y);
      }
      onUpdate({ width: newWidth, height: newHeight }, { skipHistory: true });
    });
  };

  const handleRotateStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const rect = elRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    trackDrag((ev) => {
      const angleRad = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      onUpdate({ rotation: (angleRad * 180) / Math.PI + 90 }, { skipHistory: true });
    });
  };

  return (
    <div
      ref={elRef}
      className="group absolute"
      style={{
        left: `${element.x}mm`,
        top: `${element.y}mm`,
        width: `${element.width}mm`,
        height: `${element.height}mm`,
        zIndex: element.zIndex || 0,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: "center center",
        outline: isSelected ? "1.5px solid #E8262A" : "1.5px solid transparent",
      }}
      onPointerDown={handleMoveStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="h-full w-full cursor-move">{children}</div>

      {isSelected && (
        <>
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Delete"
            className="no-print absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow-md hover:bg-[#E8262A]"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
          </button>
          <div
            data-html2canvas-ignore="true"
            onPointerDown={handleRotateStart}
            title="Drag to rotate"
            className="no-print absolute -top-6 left-1/2 flex h-4 w-4 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#C9C5BF] bg-white shadow-sm active:cursor-grabbing"
          >
            <span className="material-symbols-outlined text-[12px] text-[#6E6A65]">refresh</span>
          </div>
          <div
            data-html2canvas-ignore="true"
            onPointerDown={handleResizeStart}
            title="Drag to resize"
            className="no-print absolute -bottom-1.5 -right-1.5 flex h-4 w-4 cursor-nwse-resize items-center justify-center rounded-full border border-[#C9C5BF] bg-white shadow-sm"
          >
            <span className="material-symbols-outlined text-[10px] text-[#6E6A65]">open_in_full</span>
          </div>
        </>
      )}
    </div>
  );
}
