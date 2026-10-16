"use client";
import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph", content: [] }] };

// One real A4 page — its own independent Tiptap editor instance, its own
// rendered "sheet" DOM node. Every page in the document is always mounted
// at once (not just the active one), same architecture the Report Builder
// already uses for this exact reason: PDF export just walks the real
// rendered page nodes already on screen (via pageRefsRef in
// AgreementEditor.js) instead of needing a second off-screen render pass
// or a synthetic measure-and-split step.
export default function AgreementPage({ page, index, totalPages, isActive, onActivate, onUpdate, onEditorReady, registerRef }) {
  const editor = useEditor({
    extensions: [StarterKit, TableKit.configure({ resizable: false }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content: page.content || EMPTY_DOC,
    onUpdate: ({ editor: ed }) => {
      onUpdate(page.id, ed.getJSON());
    },
    // Avoids a Next.js hydration mismatch — Tiptap's own documented flag
    // for this (contentEditable's rendered output can't be trusted to
    // match server-rendered HTML exactly).
    immediatelyRender: false,
  });

  // Pushes externally-changed content (initial load, version restore,
  // AI-fill, a reorder that swapped which page.id this slot renders) into
  // the live editor — guarded by a string comparison so it never fights
  // with onUpdate, same pattern the single-document editor used before
  // this multi-page rework.
  useEffect(() => {
    if (!editor || !page.content) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(page.content);
    if (current !== incoming) {
      editor.commands.setContent(page.content);
    }
  }, [editor, page.content]);

  // Hands the live editor instance up to the parent so the shared
  // formatting toolbar / placeholder sidebar can bind to whichever page is
  // currently active, and lets the parent drop it from its map on unmount
  // (a deleted or reordered-away page).
  useEffect(() => {
    if (!editor) return undefined;
    onEditorReady(page.id, editor);
    return () => onEditorReady(page.id, null);
  }, [editor, page.id, onEditorReady]);

  return (
    <div className="mx-auto" style={{ width: "210mm" }} onClick={onActivate}>
      <article
        ref={(el) => registerRef(page.id, el)}
        className={`sheet agreement-document relative min-h-[297mm] w-[210mm] bg-white p-[20mm] shadow-[0_18px_50px_rgba(26,26,26,.16)] ${isActive ? "ring-2 ring-primary" : ""}`}
      >
        <EditorContent editor={editor} />
        <div className="pointer-events-none absolute bottom-[8mm] right-[20mm] text-[9px] text-[#6E6A65]">
          Page {index + 1} of {totalPages}
        </div>
      </article>
    </div>
  );
}
