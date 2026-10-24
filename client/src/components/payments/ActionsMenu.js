"use client";

import React, { useState } from "react";

// A labeled dropdown of actions — replaces a row of bare icon buttons
// (title-tooltip-only) with text labels that are unambiguous without
// hovering. Same "fixed backdrop + absolute panel" dismiss pattern the
// Agreement/Proposal editors' own "More" menu already uses.
export default function ActionsMenu({ items, label = "Actions", align = "right" }) {
  const [open, setOpen] = useState(false);
  const visibleItems = items.filter((item) => !item.hidden);
  if (visibleItems.length === 0) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded-md border border-outline-variant px-2.5 py-1.5 text-[12px] font-medium text-on-surface hover:bg-surface-variant"
      >
        {label}
        <span className="material-symbols-outlined text-[16px]">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute ${align === "right" ? "right-0" : "left-0"} z-20 mt-1 w-52 rounded-lg border border-outline-variant bg-white py-1 shadow-lg`}>
            {visibleItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                disabled={item.disabled}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50 ${item.danger ? "text-red-600" : "text-on-surface"}`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
