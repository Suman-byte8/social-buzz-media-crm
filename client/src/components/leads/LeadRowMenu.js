"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// Portal-rendered dropdown, same reasoning as ShareMenu.js: this button
// lives inside the leads table's overflow-x-auto wrapper, which forces
// overflow-y to clip too — an inline absolutely-positioned menu would get
// cut off instead of floating over the rest of the page.
export default function LeadRowMenu({ onEdit, onConvert, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleClickOutside = (e) => {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const items = [
    { label: "Edit", icon: "edit", onClick: onEdit },
    { label: "Convert to Client", icon: "person_add", onClick: onConvert },
    { label: "Delete", icon: "delete", onClick: onDelete, danger: true },
  ];

  const menu = open && position && (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: position.top, right: position.right }}
      className="z-60 w-48 rounded-lg border border-outline-variant bg-white p-1 shadow-lg"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            setOpen(false);
            item.onClick();
          }}
          className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left font-body-sm text-body-sm transition-colors ${
            item.danger ? "text-red-600 hover:bg-red-50" : "text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-on-surface-variant hover:text-on-background hover:bg-surface-container-low rounded transition-colors ml-1 border border-transparent hover:border-outline-variant/30"
        title="More"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
      </button>
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </>
  );
}
