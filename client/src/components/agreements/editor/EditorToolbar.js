"use client";
import React, { useState } from "react";

const btnClass = (active) =>
  `flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-body-sm ${
    active ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-variant"
  }`;

// A plain formatting toolbar bound to a live Tiptap `editor` instance —
// every button is a direct `editor.chain().focus().<command>().run()` call,
// Tiptap's own documented pattern, not a custom command layer on top of it.
export default function EditorToolbar({ editor }) {
  const [findOpen, setFindOpen] = useState(false);
  const [findTerm, setFindTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");

  if (!editor) return null;

  // Tiptap's core has no built-in find/replace extension — this is a
  // minimal, dependency-free implementation: walk the doc's text nodes,
  // replace every exact match, and let Tiptap's own history extension
  // (already in StarterKit) make it undoable like any other edit.
  const handleReplaceAll = () => {
    if (!findTerm) return;
    const { state } = editor;
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
      if (!node.isText) return;
      let index = node.text.indexOf(findTerm);
      while (index !== -1) {
        const from = pos + index;
        const to = from + findTerm.length;
        tr.insertText(replaceTerm, from, to);
        index = node.text.indexOf(findTerm, index + replaceTerm.length);
      }
    });
    editor.view.dispatch(tr);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant bg-surface px-3 py-2">
      <select
        value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().setHeading({ level: parseInt(value.slice(1)) }).run();
        }}
        className="h-8 rounded border border-outline-variant px-1.5 text-body-sm text-on-surface"
      >
        <option value="p">Body text</option>
        <option value="h1">Title</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
      </select>

      <div className="mx-1 h-5 w-px bg-outline-variant" />

      <button type="button" title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
        <span className="material-symbols-outlined text-[18px]">format_bold</span>
      </button>
      <button type="button" title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
        <span className="material-symbols-outlined text-[18px]">format_italic</span>
      </button>
      <button type="button" title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))}>
        <span className="material-symbols-outlined text-[18px]">format_underlined</span>
      </button>
      <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}>
        <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
      </button>

      <div className="mx-1 h-5 w-px bg-outline-variant" />

      {["left", "center", "right", "justify"].map((align) => (
        <button
          key={align}
          type="button"
          title={`Align ${align}`}
          onClick={() => editor.chain().focus().setTextAlign(align).run()}
          className={btnClass(editor.isActive({ textAlign: align }))}
        >
          <span className="material-symbols-outlined text-[18px]">{`format_align_${align}`}</span>
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-outline-variant" />

      <button
        type="button"
        title="Bulleted list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
      >
        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
      </button>
      <button
        type="button"
        title="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
      >
        <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
      </button>

      <div className="mx-1 h-5 w-px bg-outline-variant" />

      <button
        type="button"
        title="Insert table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className={btnClass(false)}
      >
        <span className="material-symbols-outlined text-[18px]">table</span>
      </button>
      {editor.isActive("table") && (
        <>
          <button type="button" title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()} className={btnClass(false)}>
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
          </button>
          <button type="button" title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()} className={btnClass(false)}>
            <span className="material-symbols-outlined text-[18px]">view_column</span>
          </button>
          <button type="button" title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()} className={btnClass(false)}>
            <span className="material-symbols-outlined text-[18px] text-red-600">delete</span>
          </button>
        </>
      )}

      <div className="mx-1 h-5 w-px bg-outline-variant" />

      <button type="button" title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btnClass(false)} disabled:opacity-30`}>
        <span className="material-symbols-outlined text-[18px]">undo</span>
      </button>
      <button type="button" title="Redo (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btnClass(false)} disabled:opacity-30`}>
        <span className="material-symbols-outlined text-[18px]">redo</span>
      </button>
      <button
        type="button"
        title="Clear formatting"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className={btnClass(false)}
      >
        <span className="material-symbols-outlined text-[18px]">format_clear</span>
      </button>

      <div className="relative ml-auto">
        <button type="button" onClick={() => setFindOpen((p) => !p)} className="flex items-center gap-1 rounded border border-outline-variant px-2 py-1.5 text-body-sm text-on-surface hover:bg-surface-variant">
          <span className="material-symbols-outlined text-[16px]">find_replace</span>
          Find &amp; replace
        </button>
        {findOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setFindOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-64 space-y-2 rounded-lg border border-outline-variant bg-white p-3 shadow-lg">
              <input
                value={findTerm}
                onChange={(e) => setFindTerm(e.target.value)}
                placeholder="Find"
                className="w-full rounded border border-outline-variant px-2 py-1.5 text-body-sm outline-none focus:border-primary"
              />
              <input
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace with"
                className="w-full rounded border border-outline-variant px-2 py-1.5 text-body-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={!findTerm}
                className="w-full rounded bg-primary py-1.5 text-body-sm font-semibold text-white disabled:opacity-50"
              >
                Replace all
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
