"use client";
import React from "react";

// Same static signature image as invoices/Termsandsignature.js — it's the
// agency's actual signature, not a signature pad or upload control, so
// reusing the same file/markup keeps both documents visually identical here.
export default function SalarySignature() {
  return (
    <section className="mt-9 grid grid-cols-[1fr_60mm] items-end gap-8 border-t border-[#DEDBD6] pt-5">
      <div>
        <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
          Note
        </p>
        <p className="mt-2 text-[10px] leading-[1.6] text-[#6E6A65]">
          This is a system-generated salary slip for the pay period stated above. Figures reflect the
          components entered at the time of generation and are subject to any subsequent correction.
        </p>
      </div>
      <div className="text-center">
        <div className="flex h-[16mm] items-end justify-center">
          <img
            src="/images/signature.png"
            alt="Authorised signatory"
            className="max-h-[15mm] w-auto object-contain"
          />
        </div>
        <p className="border-t border-[#1A1A1A] pt-1.5 text-[10px] text-[#6E6A65]">
          Authorised signatory
        </p>
        <p className="font-display text-[10.5px] font-700">Social Buzz Media</p>
      </div>
    </section>
  );
}
