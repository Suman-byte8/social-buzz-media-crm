"use client";
import React from "react";

export default function TermsAndSignature({
  terms,
  onUpdateTerm,
  onAddTerm,
  onRemoveTerm,
  showSeal = false,
}) {
  return (
    <section className="mt-6 grid grid-cols-[1fr_60mm] items-start gap-8 border-t border-[#DEDBD6] pt-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
            Terms
          </p>
          <button
            type="button"
            onClick={onAddTerm}
            data-html2canvas-ignore="true"
            className="no-print rounded border border-[#DEDBD6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6E6A65] hover:border-[#E8262A] hover:text-[#E8262A]"
          >
            + Add term
          </button>
        </div>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[10px] leading-[1.6] text-[#6E6A65]">
          {terms.map((term, i) => (
            <li key={i} className="flex items-start gap-2">
              <input
                type="text"
                value={term}
                onChange={(e) => onUpdateTerm(i, e.target.value)}
                className="w-full bg-transparent leading-[1.8] outline-none"
              />
              <button
                type="button"
                onClick={() => onRemoveTerm(i)}
                data-html2canvas-ignore="true"
                className="no-print text-[#6E6A65] hover:text-[#E8262A]"
                aria-label="Remove term"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
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
        {/* Small round company seal, under the signatory's name. */}
        {showSeal && (
          <img
            src="/images/sbm_stamp_round.png"
            alt="Social Buzz Media seal"
            className="pointer-events-none mx-auto mt-2 h-[22mm] w-[22mm] select-none object-contain opacity-90"
            style={{ transform: "rotate(-10deg)" }}
          />
        )}
      </div>
    </section>
  );
}
