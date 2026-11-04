"use client";
import React, { useMemo, useState } from "react";

// Line-item description that is both free text and a picker: the user can
// type anything, or open the list of services selected for the invoice's
// client and pick one. Typing filters that list, so it behaves like a
// normal combobox. The list and its toggle never print or export.
export default function ServiceDescriptionInput({ value, onChange, options = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasOptions = options.length > 0;

  // Show everything while the field is empty or still holds an exact pick;
  // otherwise narrow to services containing what's been typed.
  const visibleOptions = useMemo(() => {
    const query = (value || "").trim().toLowerCase();
    if (!query || options.some((o) => o.toLowerCase() === query)) return options;
    return options.filter((o) => o.toLowerCase().includes(query));
  }, [options, value]);

  const showList = isOpen && hasOptions && visibleOptions.length > 0;

  const open = () => {
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const pick = (service) => {
    onChange(service);
    close();
  };

  const handleKeyDown = (e) => {
    if (!hasOptions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) return open();
      setActiveIndex((i) => Math.min(i + 1, visibleOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && showList && activeIndex >= 0) {
      e.preventDefault();
      pick(visibleOptions[activeIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  };

  return (
    <div className="relative flex items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (hasOptions) open();
        }}
        onFocus={() => {
          if (hasOptions && !value) open();
        }}
        onBlur={close}
        onKeyDown={handleKeyDown}
        placeholder={hasOptions ? "Pick a service or type your own…" : "Service / item description…"}
        role={hasOptions ? "combobox" : undefined}
        aria-expanded={hasOptions ? showList : undefined}
        aria-autocomplete={hasOptions ? "list" : undefined}
        className="w-full bg-transparent leading-snug outline-none"
      />

      {hasOptions && (
        <button
          type="button"
          // mousedown + preventDefault keeps focus in the input, so its
          // onBlur doesn't close the list we're about to toggle open.
          onMouseDown={(e) => {
            e.preventDefault();
            if (isOpen) close();
            else open();
          }}
          data-html2canvas-ignore="true"
          className="no-print shrink-0 rounded px-1 text-[#6E6A65] hover:bg-[#F3F1EE] hover:text-[#1A1A1A] focus:outline-none"
          aria-label="Choose from the client's services"
          title="Client's services"
        >
          <span className="material-symbols-outlined align-middle text-[16px] leading-none">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
      )}

      {showList && (
        <ul
          role="listbox"
          data-html2canvas-ignore="true"
          className="no-print absolute left-0 top-full z-30 mt-1 max-h-56 w-full min-w-[60mm] overflow-y-auto rounded-md border border-[#DEDBD6] bg-white py-1 text-[11px] shadow-lg"
        >
          <li className="px-3 pb-1 pt-0.5 font-display text-[8.5px] font-700 uppercase tracking-[.18em] text-[#6E6A65]">
            Client&rsquo;s services
          </li>
          {visibleOptions.map((service, i) => (
            <li
              key={service}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(service);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-1.5 ${
                i === activeIndex ? "bg-[#FDECEC] text-[#1A1A1A]" : "text-[#1A1A1A] hover:bg-[#F7F6F4]"
              } ${service === value ? "font-semibold" : ""}`}
            >
              {service}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
