"use client";
import React from "react";

export default function KpiElementContent({ element }) {
  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-0.5 overflow-hidden rounded px-2 py-1.5"
      style={{ borderLeft: `3px solid ${element.accentColor || "#E8262A"}`, backgroundColor: "#F5F4F2" }}
    >
      <p className="truncate text-[7px] font-semibold uppercase tracking-wide text-[#6E6A65]">{element.label}</p>
      <p className="truncate text-[14px] font-bold text-[#1A1A1A]">{element.value}</p>
      {element.trend && <p className="truncate text-[7px] text-[#6E6A65]">{element.trend}</p>}
    </div>
  );
}
