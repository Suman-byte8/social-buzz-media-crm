"use client";

import React, { useState } from "react";
import { getAssetUrl } from "@/services/apiClient";
import ResumePreviewModal from "./ResumePreviewModal";

export default function IdentityResumeCard({ member }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const resumeUrl = getAssetUrl(member.resume);

  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-card">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">badge</span>
        Identity &amp; Resume
      </h2>

      <div className="space-y-5">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Employee System ID</p>
          <div className="font-mono text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant inline-block">
            TM-{member.id}
          </div>
        </div>

        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Aadhar Number</p>
          {member.aadharNumber ? (
            <p className="font-body-md text-body-md text-on-surface font-mono font-medium tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
              {member.aadharNumber.replace(/(\d{4})/g, "$1 ").trim()}
            </p>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant italic">Aadhar number not uploaded</p>
          )}
        </div>

        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Resume Document</p>
          {member.resume ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[20px]">description</span>
              Preview Resume
            </button>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant italic">No resume uploaded</p>
          )}
        </div>
      </div>

      <ResumePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        resumeUrl={resumeUrl}
        memberName={member.name}
      />
    </div>
  );
}
