"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

const PAGE_SIZE = 20;

// Same searchable-popover pattern as invoices/ClientSelectDropdown.js, kept
// as its own copy rather than a shared/generalized component since the two
// pick different record types with different copy ("team member" vs
// "client") and live in unrelated parts of the app.
export default function TeamMemberSelectDropdown({ members, isMembersLoading, selectedMemberId, onMemberChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const selectedMember = members.find((m) => String(m.id) === String(selectedMemberId));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, search]);

  const visibleMembers = filtered.slice(0, visibleCount);

  const openDropdown = () => {
    setSearch("");
    setVisibleCount(PAGE_SIZE);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setVisibleCount((prev) => Math.min(filtered.length, prev + PAGE_SIZE));
    }
  }, [filtered.length]);

  const handleSelect = (member) => {
    onMemberChange(String(member.id));
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        disabled={isMembersLoading}
        className="flex w-full max-w-[74mm] cursor-pointer items-center justify-between gap-2 rounded border border-[#DEDBD6] bg-white px-2 py-1.5 text-left font-display text-[13px] font-700 text-[#1A1A1A] focus:outline-none focus:border-[#E8262A] focus:ring-1 focus:ring-[#E8262A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">
          {isMembersLoading ? "Loading team…" : selectedMember ? selectedMember.name : "Select a team member…"}
        </span>
        <span className="material-symbols-outlined shrink-0 text-[16px] text-[#6E6A65]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full max-w-[74mm] rounded border border-[#DEDBD6] bg-white shadow-lg">
          <div className="border-b border-[#DEDBD6] p-1.5">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search team members…"
              className="w-full rounded border border-[#DEDBD6] px-2 py-1 text-[12px] text-[#1A1A1A] outline-none focus:border-[#E8262A]"
            />
          </div>
          <div ref={listRef} onScroll={handleScroll} className="max-h-56 overflow-y-auto">
            {visibleMembers.length === 0 ? (
              <p className="px-2 py-3 text-[12px] text-[#6E6A65]">No team members found.</p>
            ) : (
              visibleMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelect(m)}
                  className={`block w-full truncate px-2 py-1.5 text-left text-[12.5px] text-[#1A1A1A] hover:bg-[#FDECEC] ${
                    String(m.id) === String(selectedMemberId) ? "bg-[#FDECEC] font-700" : ""
                  }`}
                >
                  {m.name}
                </button>
              ))
            )}
            {visibleCount < filtered.length && (
              <p className="px-2 py-1.5 text-center text-[10.5px] text-[#6E6A65]">Scroll for more…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
