"use client";
import React, { useState, useRef, useEffect } from "react";

// Double-click enters edit mode (a real contentEditable div, marked
// data-no-drag so CanvasElement's move-gesture handler lets clicks inside
// it place a caret normally instead of starting a drag); blurring commits
// the html and exits edit mode. Single-click/drag on the non-editing view
// still moves/selects the element, same as every other element type.
export default function TextElementContent({ element, onChangeHtml }) {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isEditing || !ref.current) return;
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }, [isEditing]);

  const style = {
    fontSize: `${element.fontSize || 12}px`,
    fontFamily: element.fontFamily || "Inter, sans-serif",
    color: element.color || "#1A1A1A",
    textAlign: element.align || "left",
    fontWeight: element.bold ? 700 : 400,
    fontStyle: element.italic ? "italic" : "normal",
    textDecoration: element.underline ? "underline" : "none",
    lineHeight: element.lineHeight || 1.4,
    letterSpacing: `${element.letterSpacing || 0}px`,
    width: "100%",
    height: "100%",
    outline: "none",
    overflow: "hidden",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  };

  if (isEditing) {
    return (
      <div
        ref={ref}
        data-no-drag="true"
        contentEditable
        suppressContentEditableWarning
        style={style}
        onBlur={(e) => {
          setIsEditing(false);
          onChangeHtml(e.currentTarget.innerHTML);
        }}
        dangerouslySetInnerHTML={{ __html: element.html || "" }}
      />
    );
  }

  return (
    <div
      style={style}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      dangerouslySetInnerHTML={{ __html: element.html || "" }}
    />
  );
}
