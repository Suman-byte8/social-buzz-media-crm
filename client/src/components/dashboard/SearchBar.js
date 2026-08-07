"use client";

import React from "react";

export default function SearchBar({ value, onChange, placeholder = "Search across Agency OS..." }) {
  return (
    <div className="relative w-full max-w-md hidden md:block">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">
        search
      </span>
      <input
        value={value}
        onChange={onChange}
        className="w-full bg-black/5 border-none rounded-full pl-10 pr-4 py-2 font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/50"
        placeholder={placeholder}
        type="text"
      />
    </div>
  );
}
