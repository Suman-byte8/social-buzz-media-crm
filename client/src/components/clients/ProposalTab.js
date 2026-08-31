"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProposals, uploadProposal, deleteProposal } from "@/redux/slices/documentsSlice";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const formatSize = (bytes) => {
  if (!bytes) return "N/A";
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ProposalTab({ client, clientId }) {
  const dispatch = useDispatch();
  const { proposals, loadingProposals } = useSelector((state) => state.documents);
  const fileInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clientId) {
      dispatch(fetchProposals(clientId));
    }
  }, [dispatch, clientId]);

  const filteredProposals = useMemo(() => {
    if (!search.trim()) return proposals;
    const q = search.trim().toLowerCase();
    return proposals.filter((p) => p.fileName?.toLowerCase().includes(q));
  }, [proposals, search]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 2MB");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("clientId", clientId);
      formData.append("documentType", "proposal");
      if (description.trim()) formData.append("description", description.trim());

      await dispatch(uploadProposal(formData)).unwrap();
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to upload proposal");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this proposal? This will not remove the file from Google Drive.")) return;
    dispatch(deleteProposal(id));
  };

  return (
    <div className="flex flex-col gap-stack-md">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-outline-variant shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Files upload to the client&apos;s Drive folder, in the Proposals subfolder.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-outline-variant pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="flex-1 text-body-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-surface-container file:text-on-surface file:font-label-sm file:cursor-pointer"
          />
          <input
            className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Description (optional)"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="shrink-0 px-5 py-2.5 bg-primary hover:bg-surface-tint text-on-primary rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {uploading ? "progress_activity" : "upload"}
            </span>
            {uploading ? "Uploading..." : "Upload New Proposal"}
          </button>
        </div>
        {error && <p className="text-red-600 font-body-sm text-body-sm">{error}</p>}
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
                  Date Uploaded
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Size
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loadingProposals ? (
                <tr>
                  <td colSpan="4" className="py-8 px-6 text-center text-on-surface-variant">
                    <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                  </td>
                </tr>
              ) : filteredProposals.length > 0 ? (
                filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-[#F9F9F9] transition-colors group">
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
                            {proposal.fileName}
                          </p>
                          {proposal.description && (
                            <p className="font-label-sm text-label-sm text-tertiary">{proposal.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant">
                      {formatSize(proposal.fileSize)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(proposal.webViewLink || proposal.googleUserContentLink) && (
                          <a
                            href={proposal.webViewLink || proposal.googleUserContentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors"
                            title="View in Drive"
                          >
                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          className="p-2 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 px-6 text-center text-on-surface-variant font-body-sm">
                    {search.trim() ? "No proposals match your search." : "No proposals uploaded for this client yet."}
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
