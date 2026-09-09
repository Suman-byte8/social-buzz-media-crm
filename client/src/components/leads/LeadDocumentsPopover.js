"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import LeadDocumentsPanel from "./LeadDocumentsPanel";

// Same portal + fixed-position pattern as LeadRowMenu/ShareMenu (the table's
// overflow-x-auto wrapper clips overflow-y too, so an inline dropdown would
// get cut off). Lets a lead's proposals/agreements be uploaded and shared
// straight from the table row, without opening the full Edit Lead modal for
// what's often a frequent, standalone action.
export default function LeadDocumentsPopover({ lead }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleClickOutside = (e) => {
      if (buttonRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
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

  const panel = open && position && (
    <div
      ref={panelRef}
      style={{ position: "fixed", top: position.top, right: position.right }}
      className="z-60 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-outline-variant bg-white p-4 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-title-sm text-title-sm text-on-surface">Documents — {lead.companyName}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 text-secondary hover:text-primary transition-colors rounded"
          title="Close"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <LeadDocumentsPanel lead={lead} embedded />
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors"
        title="Documents"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </>
  );
}
