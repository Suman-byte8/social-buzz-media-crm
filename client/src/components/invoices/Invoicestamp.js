"use client";
import React from "react";

export default function InvoiceStamp({ mode }) {
  if (mode === "none") return null;

  const isPaid = mode === "paid";

  return (
    <div
      className="stamp pointer-events-none absolute bottom-[52mm] right-[24mm] select-none border-[3px] px-4 py-1.5 font-display text-[19px] font-800 uppercase opacity-80"
      style={{
        transform: isPaid ? "rotate(-9deg)" : "rotate(0deg)",
        color: isPaid ? "#0d7055" : "#E8262A",
        borderColor: isPaid ? "#0d7055" : "#E8262A",
      }}
    >
      {isPaid ? "Paid" : "Payment due"}
    </div>
  );
}
