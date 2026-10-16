"use client";
import React from "react";

// Pulls a short plain-text preview out of a page's Tiptap JSON — walks the
// first couple of block nodes rather than the whole page (a dense legal
// page can run to hundreds of words, far more than a thumbnail needs).
function previewText(content) {
  const parts = [];
  const walk = (node) => {
    if (parts.join(" ").length > 120) return;
    if (node.type === "text" && node.text) parts.push(node.text);
    (node.content || []).forEach(walk);
  };
  (content?.content || []).slice(0, 4).forEach(walk);
  return parts.join(" ").slice(0, 140);
}

export default function AgreementPageThumbnail({ page, index, isSelected, canDelete, onSelect, onDelete, onDragStart, onDragOver, onDrop }) {
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
      <div className="mx-auto overflow-hidden rounded border border-outline-variant bg-white p-2 shadow-sm" style={{ aspectRatio: "210 / 297" }}>
        <p className="text-[6px] leading-tight text-on-surface-variant">{previewText(page.content)}</p>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant">Page {index + 1}</span>
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete page"
            className="hidden rounded p-0.5 text-on-surface-variant hover:text-red-600 group-hover:block"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
