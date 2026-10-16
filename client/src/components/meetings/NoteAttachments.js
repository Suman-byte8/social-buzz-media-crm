"use client";

import React from "react";
import { getAssetUrl } from "@/services/apiClient";

// Shared, upscaled display for a note's three attachment buckets
// (screenshot dump / documents / image links — all documentType "note",
// grouped by noteId/noteAttachmentKind upstream). Used by both the global
// Meeting Notes page and the per-client Notes tab so an attachment looks
// and behaves the same wherever a note is viewed.

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const EXTENSION_ICON = {
  pdf: { icon: "picture_as_pdf", color: "text-red-600 bg-red-50" },
  doc: { icon: "description", color: "text-blue-600 bg-blue-50" },
  docx: { icon: "description", color: "text-blue-600 bg-blue-50" },
  xls: { icon: "table_chart", color: "text-green-600 bg-green-50" },
  xlsx: { icon: "table_chart", color: "text-green-600 bg-green-50" },
  csv: { icon: "table_chart", color: "text-green-600 bg-green-50" },
  ppt: { icon: "slideshow", color: "text-orange-600 bg-orange-50" },
  pptx: { icon: "slideshow", color: "text-orange-600 bg-orange-50" },
  zip: { icon: "folder_zip", color: "text-amber-600 bg-amber-50" },
  rar: { icon: "folder_zip", color: "text-amber-600 bg-amber-50" },
};
const DEFAULT_ICON = { icon: "draft", color: "text-indigo-600 bg-indigo-50" };

const iconFor = (fileName) => {
  const ext = (fileName || "").split(".").pop()?.toLowerCase();
  return EXTENSION_ICON[ext] || DEFAULT_ICON;
};

function ImageGrid({ items, title, icon, onDelete }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1.5 flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[15px]">{icon}</span>
        {title}
        <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] font-medium">{items.length}</span>
      </h4>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {items.map((doc) => (
          <div key={doc.id} className="group relative aspect-square overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
            <a href={getAssetUrl(`/api/documents/${doc.id}/stream`)} target="_blank" rel="noopener noreferrer" title={doc.fileName}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a square thumbnail of a user-uploaded file streamed from our own API, not an optimizable static asset. */}
              <img
                src={getAssetUrl(`/api/documents/${doc.id}/stream`)}
                alt={doc.fileName}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </a>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate text-[9px] text-white">{doc.fileName}</p>
            </div>
            <button
              type="button"
              onClick={() => onDelete(doc.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              title="Delete"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NoteAttachments({ attachments, onDelete }) {
  const documents = attachments?.document || [];
  const screenshots = attachments?.screenshot || [];
  const imageLinks = attachments?.image_link || [];
  const total = documents.length + screenshots.length + imageLinks.length;
  if (total === 0) return null;

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest/60 p-3">
      <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[15px]">attach_file</span>
        Attachments
        <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] font-medium">{total}</span>
      </div>

      {documents.length > 0 && (
        <div className="space-y-1">
          {documents.map((doc) => {
            const meta = iconFor(doc.fileName);
            return (
              <a
                key={doc.id}
                href={getAssetUrl(`/api/documents/${doc.id}/stream`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 rounded-lg border border-transparent bg-white px-2.5 py-2 transition-all hover:border-outline-variant hover:shadow-sm"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${meta.color}`}>
                  <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-sm text-label-sm text-on-surface">{doc.fileName}</p>
                  {doc.fileSize ? <p className="text-[11px] text-on-surface-variant">{formatFileSize(doc.fileSize)}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(doc.id);
                  }}
                  className="shrink-0 rounded-full p-1 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </a>
            );
          })}
        </div>
      )}

      <ImageGrid items={screenshots} title="Screenshot Dump" icon="content_paste" onDelete={onDelete} />
      <ImageGrid items={imageLinks} title="Image Links" icon="image" onDelete={onDelete} />
    </div>
  );
}
