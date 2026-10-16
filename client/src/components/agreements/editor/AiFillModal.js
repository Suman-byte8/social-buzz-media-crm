"use client";
import React, { useState } from "react";

// Lets the user hand Gemini the client's accepted proposal and have it
// fill in Schedule A directly — the template's own instructions already
// say to "copy the modules, fees and ad budget from the accepted
// proposal into Schedule A" by hand; this does that reading for the user.
// Only fields Gemini actually finds get touched (see
// applyScheduleAExtraction's own comment) — everything else in the
// document, including any [bracketed] field already filled in by hand,
// is left exactly as it was.
export default function AiFillModal({ open, onClose, onFill }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | working | success | error
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
  };

  const handleClose = () => {
    if (status === "working") return;
    reset();
    onClose();
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setErrorMessage("PDF, PNG, JPG, or WebP only");
      return;
    }
    setErrorMessage("");
    setFile(f);
  };

  const handleRun = async () => {
    if (!file) return;
    setStatus("working");
    setErrorMessage("");
    try {
      await onFill(file);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Could not read the proposal");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-indigo-600">auto_awesome</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">AI-fill Schedule A</h2>
        </div>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Upload the client&apos;s accepted proposal — Gemini reads it and fills in the services, fees, ad budget, and access details in Schedule A. Nothing else in the document is touched, and it never invents numbers it can&apos;t find.
        </p>

        {status === "success" ? (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-4 text-center">
            <span className="material-symbols-outlined text-[28px] text-green-600">check_circle</span>
            <p className="mt-1 font-label-md text-label-md text-green-800">Schedule A updated</p>
            <p className="mt-0.5 text-[11px] text-green-700">Review the changes in the document — anything Gemini couldn&apos;t find was left as-is.</p>
          </div>
        ) : (
          <>
            {errorMessage && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{errorMessage}</p>}
            <div
              onClick={() => status !== "working" && document.getElementById("ai-fill-file-input")?.click()}
              onDrop={(e) => {
                e.preventDefault();
                if (status !== "working") handleFile(e.dataTransfer.files?.[0]);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="mt-4 flex min-h-[90px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant px-4 py-6 text-center hover:border-primary"
            >
              {status === "working" ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[24px] text-indigo-600">progress_activity</span>
                  <span className="text-body-sm text-on-surface-variant">Reading the proposal…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant">upload_file</span>
                  <span className="text-body-sm text-on-surface-variant">{file ? file.name : "Click to upload, or drag and drop a PDF/image"}</span>
                </>
              )}
              <input
                id="ai-fill-file-input"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} disabled={status === "working"} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            {status === "success" ? "Close" : "Cancel"}
          </button>
          {status !== "success" && (
            <button
              type="button"
              onClick={handleRun}
              disabled={!file || status === "working"}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              {status === "working" ? "Working…" : "Fill Schedule A"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
