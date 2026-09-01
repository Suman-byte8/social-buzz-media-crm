"use client";
import React from "react";

const STAMP_CONFIG = {
  paid: { label: "Paid", color: "#0d7055", rotate: "-9deg" },
  advance: { label: "Advance paid", color: "#2563EB", rotate: "-9deg" },
  due: { label: "Payment due", color: "#E8262A", rotate: "0deg" },
};

export default function InvoiceStamp({ mode }) {
  const config = STAMP_CONFIG[mode];
  if (!config) return null;

  return (
    <div
      className="stamp pointer-events-none absolute bottom-[52mm] right-[24mm] select-none border-[3px] px-4 py-1.5 font-display text-[19px] font-800 uppercase opacity-80"
      style={{
        transform: `rotate(${config.rotate})`,
        color: config.color,
        borderColor: config.color,
      }}
    >
      {config.label}
    </div>
  );
}
