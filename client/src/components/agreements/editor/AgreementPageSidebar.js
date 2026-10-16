"use client";
import React, { useRef } from "react";
import AgreementPageThumbnail from "./AgreementPageThumbnail";

// Mirrors the Report Builder's PageSidebar.js drag-reorder mechanics
// exactly (native HTML5 drag, a ref tracking the dragged index rather than
// component state so a fast drag never fights a re-render) — the same
// proven pattern, just pointed at Tiptap pages instead of canvas pages.
export default function AgreementPageSidebar({ pages, activePageId, onSelectPage, onAddPage, onDeletePage, onReorderPages }) {
  const dragIndexRef = useRef(null);

  return (
    <aside className="flex h-full w-[180px] shrink-0 flex-col border-r border-outline-variant bg-surface">
      <div className="flex items-center justify-between border-b border-outline-variant p-3">
        <h3 className="font-label-md text-label-md text-on-surface">Pages ({pages.length})</h3>
        <button
          type="button"
          onClick={onAddPage}
          title="Add a blank page"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {pages.map((page, index) => (
          <AgreementPageThumbnail
            key={page.id}
            page={page}
            index={index}
            isSelected={page.id === activePageId}
            canDelete={pages.length > 1}
            onSelect={() => onSelectPage(page.id)}
            onDelete={() => {
              if (window.confirm(`Delete page ${index + 1}? This can't be undone once you save.`)) onDeletePage(page.id);
            }}
            onDragStart={(i) => {
              dragIndexRef.current = i;
            }}
            onDragOver={() => {}}
            onDrop={(dropIndex) => {
              if (dragIndexRef.current === null || dragIndexRef.current === dropIndex) return;
              onReorderPages(dragIndexRef.current, dropIndex);
              dragIndexRef.current = null;
            }}
          />
        ))}
      </div>
    </aside>
  );
}
