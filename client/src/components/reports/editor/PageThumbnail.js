"use client";
import React, { useState } from "react";

const ELEMENT_PREVIEW_COLOR = { text: "transparent", image: "#D9D5D0", shape: null, table: "#EFEDEA", kpi: "#F5F4F2" };

// A simplified, non-interactive miniature of a page — colored boxes for
// each element's position/size rather than a full re-render of every type's
// real content, which is plenty to navigate by and far cheaper to keep in
// sync with the live document.
function MiniPreview({ page, pageWidthMm, pageHeightMm }) {
  const background = page.background || { type: "color", value: "#FFFFFF" };
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: background.type === "color" ? background.value : "#FFFFFF",
        backgroundImage: background.type === "image" && background.value ? `url(${background.value})` : "none",
        backgroundSize: "cover",
      }}
    >
      {page.elements.map((el) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${(el.x / pageWidthMm) * 100}%`,
            top: `${(el.y / pageHeightMm) * 100}%`,
            width: `${(el.width / pageWidthMm) * 100}%`,
            height: `${(el.height / pageHeightMm) * 100}%`,
            transform: `rotate(${el.rotation || 0}deg)`,
            backgroundColor: el.type === "shape" ? el.fill : ELEMENT_PREVIEW_COLOR[el.type] || "#E5E5E5",
            borderRadius: el.type === "shape" && el.shapeType === "circle" ? "50%" : 0,
            border: el.type === "text" ? "none" : "0.5px solid rgba(0,0,0,0.06)",
          }}
        />
      ))}
    </div>
  );
}

export default function PageThumbnail({
  page,
  pageWidthMm,
  pageHeightMm,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  onRename,
  onDragStart,
  onDragOver,
  onDrop,
  canDelete,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(page.name);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={() => onDrop(index)}
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-lg border-2 p-1.5 transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-outline-variant"
      }`}
    >
      <div
        className="mx-auto overflow-hidden rounded border border-outline-variant bg-white shadow-sm"
        style={{ aspectRatio: `${pageWidthMm} / ${pageHeightMm}` }}
      >
        <MiniPreview page={page} pageWidthMm={pageWidthMm} pageHeightMm={pageHeightMm} />
      </div>

      <div className="mt-1 flex items-center gap-1">
        <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{index + 1}.</span>
        {isRenaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => {
              onRename(nameDraft.trim() || page.name);
              setIsRenaming(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-full rounded border border-outline-variant px-1 text-[10px] outline-none focus:border-primary"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            className="flex-1 truncate text-[10px] text-on-surface-variant"
            title="Double-click to rename"
          >
            {page.name}
          </span>
        )}
      </div>

      <div className="absolute right-1.5 top-1.5 hidden gap-0.5 group-hover:flex">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate page"
          className="rounded bg-white/95 p-0.5 text-on-surface-variant shadow hover:text-primary"
        >
          <span className="material-symbols-outlined text-[13px]">content_copy</span>
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete page"
            className="rounded bg-white/95 p-0.5 text-on-surface-variant shadow hover:text-red-600"
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
