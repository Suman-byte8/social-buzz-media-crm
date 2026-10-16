"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ProposalEmailButton from "./ProposalEmailButton";
import { getAssetUrl } from "@/services/apiClient";

// Cross-client counterpart to ProposalTab.js's own inline table — same
// columns/row markup (no Status column/View/Edit-metadata modals, since
// those never existed for proposals anywhere in the app — unlike
// AgreementsTable.js, which mirrors a fuller feature set this one
// deliberately doesn't carry over), generalized with a Client column and
// client-lookup props for cross-client use, plus the email action and the
// Generated-badge/edit-in-generator link this feature already added to
// ProposalTab.js.
const formatSize = (bytes) => {
  if (!bytes) return "N/A";
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ProposalsTable({ proposals, loading, clients = [], getClientName, onDelete }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-b-xl border border-outline-variant shadow-card overflow-hidden">
      <table className="w-full text-left border-collapse table-fixed">
        <colgroup>
          <col className="w-[36%]" />
          <col className="w-[18%]" />
          <col className="w-[16%]" />
          <col className="w-[10%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Proposal</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Client</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Uploaded</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Size</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-body-sm font-body-sm">
          {loading ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-secondary">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading proposals...
              </td>
            </tr>
          ) : proposals.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">description</span>
                No proposals found.
              </td>
            </tr>
          ) : (
            proposals.map((proposal) => {
              const client = clients.find((c) => c.id === proposal.clientId) || null;
              return (
                <tr key={proposal.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                  <td className="py-4 px-4 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[24px] shrink-0">description</span>
                      <div className="min-w-0">
                        {/* Proxied through our own backend, same reasoning
                            as AgreementsTable.js's identical comment. */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getAssetUrl(`/api/documents/${proposal.id}/stream`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-title-md text-title-md text-on-surface hover:text-primary transition-colors truncate block"
                            title={proposal.fileName}
                          >
                            {proposal.fileName}
                          </a>
                          {proposal.proposalId && (
                            <span
                              title="Generated with the Proposal Generator — click the editor icon to keep editing it"
                              className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                            >
                              Generated
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary truncate" title={proposal.description}>
                          {proposal.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-on-surface truncate">{getClientName(proposal.clientId)}</td>
                  <td className="py-4 px-4 text-secondary whitespace-nowrap">{formatDate(proposal.createdAt)}</td>
                  <td className="py-4 px-4 text-secondary whitespace-nowrap">{formatSize(proposal.fileSize)}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ProposalEmailButton proposal={proposal} client={client} />
                      {proposal.proposalId && (
                        <button
                          onClick={() => router.push(`/proposals/${proposal.proposalId}/edit`)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors"
                          title="Open in Proposal Editor"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit_document</span>
                        </button>
                      )}
                      {(proposal.webViewLink || proposal.googleUserContentLink) && (
                        <a
                          href={proposal.webViewLink || proposal.googleUserContentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors"
                          title="View in Drive"
                        >
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                        </a>
                      )}
                      <button
                        onClick={() => onDelete(proposal.id)}
                        className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Proposal"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
