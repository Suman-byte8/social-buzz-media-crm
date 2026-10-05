"use client";
import React, { useRef } from "react";
import { PAGE_CONTENT_WIDTH_MM, PAGE_CONTENT_HEIGHT_MM, MIN_TILE_WIDTH_MM, clamp } from "../../lib/customReportLayout";

// One freely draggable/resizable/rotatable "photo" on a Freeform report
// page. Three independent drag gestures, each implemented the same way:
// record the starting pointer position + starting tile value on
// pointerdown, convert pointer px deltas to mm via the page content
// container's live rendered width (so this works at any zoom level without
// hardcoding a DPI), and listen on `document` (not the handle itself) for
// move/up so the drag keeps tracking even if the pointer leaves the handle.
//
// Resizing always keeps the image's original aspect ratio — dragging the
// corner handle scales it uniformly rather than stretching width/height
// independently, same "scaled, never stretched or cropped" rule the Auto
// grid layout (imageGridLayout.js) follows.
export default function ReportImageTile({ tile, pageContentRef, onUpdate, onRemove, onFocus }) {
  const tileRef = useRef(null);

  const getPxPerMm = () => {
    const rect = pageContentRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? rect.width / PAGE_CONTENT_WIDTH_MM : 1;
  };

  const trackDrag = (onMove) => {
    const handleUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", handleUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", handleUp);
  };

  const handleMoveStart = (e) => {
    e.preventDefault();
    onFocus();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = tile.x;
    const startY = tile.y;
    const pxPerMm = getPxPerMm();

    trackDrag((ev) => {
      const dxMm = (ev.clientX - startClientX) / pxPerMm;
      const dyMm = (ev.clientY - startClientY) / pxPerMm;
      onUpdate({
        x: clamp(startX + dxMm, 0, Math.max(0, PAGE_CONTENT_WIDTH_MM - tile.width)),
        y: clamp(startY + dyMm, 0, Math.max(0, PAGE_CONTENT_HEIGHT_MM - tile.height)),
      });
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    const startClientX = e.clientX;
    const startWidth = tile.width;
    const aspect = tile.naturalWidth / tile.naturalHeight;
    const pxPerMm = getPxPerMm();

    trackDrag((ev) => {
      const dxMm = (ev.clientX - startClientX) / pxPerMm;
      let newWidth = clamp(startWidth + dxMm, MIN_TILE_WIDTH_MM, PAGE_CONTENT_WIDTH_MM - tile.x);
      let newHeight = newWidth / aspect;
      if (tile.y + newHeight > PAGE_CONTENT_HEIGHT_MM) {
        newHeight = PAGE_CONTENT_HEIGHT_MM - tile.y;
        newWidth = newHeight * aspect;
      }
      onUpdate({ width: newWidth, height: newHeight });
    });
  };

  const handleRotateStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    const rect = tileRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    trackDrag((ev) => {
      const angleRad = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      // +90 so the handle sitting above the tile's center corresponds to 0deg.
      onUpdate({ rotation: (angleRad * 180) / Math.PI + 90 });
    });
  };

  return (
    <div
      ref={tileRef}
      className="group absolute"
      style={{
        left: `${tile.x}mm`,
        top: `${tile.y}mm`,
        width: `${tile.width}mm`,
        zIndex: tile.z || 0,
        transform: `rotate(${tile.rotation || 0}deg)`,
        transformOrigin: "center center",
      }}
    >
      {/* The image renders exactly as pasted — no border/shadow treatment —
          so this, not the handles below, is what the PDF captures. */}
      <div onPointerDown={handleMoveStart} className="cursor-move select-none">
        <img src={tile.src} alt="" draggable={false} className="block w-full object-contain" style={{ height: `${tile.height}mm` }} />
      </div>

      {/* Edit handles — excluded from the exported PDF/print the same way
          the Auto grid's per-image remove button already is. */}
      <button
        type="button"
        data-html2canvas-ignore="true"
        onClick={onRemove}
        title="Remove image"
        className="no-print absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow-md hover:bg-[#E8262A] group-hover:flex"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>

      <div
        data-html2canvas-ignore="true"
        onPointerDown={handleRotateStart}
        title="Drag to rotate"
        className="no-print absolute -top-6 left-1/2 hidden h-4 w-4 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#C9C5BF] bg-white shadow-sm active:cursor-grabbing group-hover:flex"
      >
        <span className="material-symbols-outlined text-[12px] text-[#6E6A65]">refresh</span>
      </div>

      <div
        data-html2canvas-ignore="true"
        onPointerDown={handleResizeStart}
        title="Drag to resize"
        className="no-print absolute -bottom-1.5 -right-1.5 hidden h-4 w-4 cursor-nwse-resize items-center justify-center rounded-full border border-[#C9C5BF] bg-white shadow-sm group-hover:flex"
      >
        <span className="material-symbols-outlined text-[10px] text-[#6E6A65]">open_in_full</span>
      </div>
    </div>
  );
}
