"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { uploadProposal } from "@/redux/slices/documentsSlice";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Cross-client counterpart to the inline upload form in ProposalTab.js (the
// per-client tab doesn't need a client picker since it's already scoped to
// one) — same file/description fields, no issued/expiry/status fields since
// proposals never had those, unlike AgreementUploadModal.js. Mounted only
// while open (see the page's own {uploadModalOpen && <ProposalUploadModal
// .../>}), same pattern GenerateProposalModal.js uses — a fresh mount gets
// fresh initial state for free, no reset-on-open effect needed.
export default function ProposalUploadModal({ onClose, onSuccess, clients, defaultClientId }) {
  const dispatch = useDispatch();
  const [clientId, setClientId] = useState(defaultClientId ? String(defaultClientId) : "");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 2MB");
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client");
      return;
    }
    if (!selectedFile) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("clientId", clientId);
      formData.append("documentType", "proposal");
      if (description.trim()) formData.append("description", description.trim());

      const result = await dispatch(uploadProposal(formData)).unwrap();
      onSuccess(result);
      onClose();
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to upload proposal");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white";

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-on-surface">Upload Proposal</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1" title="Close">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Client *</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass} required>
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Proposal File (PDF, Max 2MB)</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} className={inputClass} disabled={loading} />
            {selectedFile?.name && <p className="mt-1 text-sm text-green-600">{selectedFile.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              disabled={loading}
              placeholder="Add any additional notes about this proposal"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-medium border border-outline-variant rounded-lg hover:bg-gray-50 text-secondary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Upload Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
