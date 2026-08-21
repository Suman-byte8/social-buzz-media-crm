"use client";

import React from "react";

export default function ProposalTab({ client }) {
  const proposals = Array.isArray(client?.proposals) ? client.proposals :
    (client?.proposals ? client.proposals.split(",") : []);

  return (
    <div className="flex flex-col gap-stack-md">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-stack-md bg-white p-4 rounded-xl border border-outline-variant shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
        <div className="relative w-full sm:w-80">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary-fixed-dim"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Search proposals..."
            type="text"
          />
        </div>
        <button className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-surface-tint text-on-primary rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2 shadow-sm">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            upload
          </span>
          Upload New Proposal
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-[0px_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Proposal Name
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Version
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Date Uploaded
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Size
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Status
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {proposals.length > 0 ? (
                proposals.map((proposal, idx) => (
                  <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary">
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            description
                          </span>
                        </div>
                        <div>
                          <p className="font-body-sm text-body-sm font-medium text-on-background">
                            {proposal.name || proposal}
                          </p>
                          <p className="font-label-sm text-label-sm text-tertiary">
                            {proposal.type || "PDF Document"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant">
                      {proposal.version || `v${idx + 1}.0`}
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant">
                      {proposal.date || "N/A"}
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant">
                      {proposal.size || "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl font-label-sm text-label-sm bg-[#E8F5E9] text-[#2E7D32]">
                        {proposal.status || "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors"
                          title="View"
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 0" }}
                          >
                            visibility
                          </span>
                        </button>
                        <button
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors"
                          title="Download"
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 0" }}
                          >
                            download
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 px-6 text-center text-on-surface-variant font-body-sm">
                    No proposals uploaded for this client yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}