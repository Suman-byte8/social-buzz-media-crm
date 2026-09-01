"use client";

import React, { useEffect, useState } from "react";

const isImageType = (type) => Boolean(type?.startsWith("image/"));
const isPdfType = (type) => type === "application/pdf";

// Resumes can be a PDF, an image, or a Word doc (see the file input's
// `accept` in AddTeamMemberModal/EditMemberModal). Only PDFs and images can
// actually be rendered inline in a browser — everything else falls back to
// a clear "download instead" message rather than a blank/broken iframe.
// The file type isn't stored anywhere (the DB only holds the Drive proxy
// link), so it's detected here via a HEAD request's Content-Type each time
// the modal opens.
export default function ResumePreviewModal({ open, onClose, resumeUrl, memberName }) {
  const [contentType, setContentType] = useState(null);
  const [checking, setChecking] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    if (!open || !resumeUrl) return;
    let cancelled = false;

    setChecking(true);
    setCheckFailed(false);
    setContentType(null);

    fetch(resumeUrl, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to load resume");
        setContentType(res.headers.get("content-type"));
      })
      .catch(() => {
        if (!cancelled) setCheckFailed(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, resumeUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 p-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-on-surface truncate pr-4">
            {memberName ? `${memberName}'s Resume` : "Resume"}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={resumeUrl}
              download
              className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download
            </a>
            <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1" title="Close">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 border border-outline-variant rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[50vh]">
          {checking ? (
            <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant">
              progress_activity
            </span>
          ) : checkFailed ? (
            <p className="text-on-surface-variant text-sm p-6 text-center">
              Couldn&apos;t load this file. Try the Download button above instead.
            </p>
          ) : isPdfType(contentType) ? (
            <iframe src={resumeUrl} title="Resume preview" className="w-full h-[70vh]" />
          ) : isImageType(contentType) ? (
            <img src={resumeUrl} alt="Resume preview" className="max-w-full max-h-[70vh] object-contain" />
          ) : (
            <div className="text-center p-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">description</span>
              <p className="text-on-surface-variant text-sm">
                Preview isn&apos;t available for this file type{contentType ? ` (${contentType})` : ""}.
                <br />
                Use the Download button above instead.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
