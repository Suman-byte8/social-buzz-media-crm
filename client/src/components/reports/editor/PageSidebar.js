"use client";
import React, { useRef, useState } from "react";
import PageThumbnail from "./PageThumbnail";
import { PAGE_LAYOUTS } from "@/lib/reportPageLayouts";
import { PAGE_SIZES } from "./EditorCanvas";

export default function PageSidebar({ pages, pageSize, selectedPageId, onSelectPage, onAddPage, onDuplicatePage, onDeletePage, onRenamePage, onReorderPages }) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const dragIndexRef = useRef(null);
  const { width, height } = PAGE_SIZES[pageSize] || PAGE_SIZES["a4-portrait"];

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-outline-variant bg-surface">
      <div className="flex items-center justify-between border-b border-outline-variant p-3">
        <h3 className="font-label-md text-label-md text-on-surface">Pages ({pages.length})</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddMenuOpen((prev) => !prev)}
            title="Add page"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          {addMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                {Object.entries(PAGE_LAYOUTS).map(([kind, layout]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      onAddPage(kind);
                      setAddMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">{layout.icon}</span>
                    {layout.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            pageWidthMm={width}
            pageHeightMm={height}
            index={index}
            isSelected={page.id === selectedPageId}
            canDelete={pages.length > 1}
            onSelect={() => onSelectPage(page.id)}
            onDuplicate={() => onDuplicatePage(page.id)}
            onDelete={() => {
              if (window.confirm(`Delete "${page.name}"? This can't be undone once you save.`)) onDeletePage(page.id);
            }}
            onRename={(name) => onRenamePage(page.id, name)}
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
