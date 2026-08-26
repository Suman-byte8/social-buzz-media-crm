"use client";

import React, { useState, useEffect } from "react";
import { uploadAgreement, updateAgreement } from "@/services/documentService";

const defaultFormData = () => ({
  file: null,
  issuedDate: new Date().toISOString().split("T")[0],
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  status: "active",
  description: "",
});

export default function AgreementUploadModal({
  open,
  onClose,
  onSuccess,
  clients,
  defaultClientId,
  agreementToEdit = null,
  isEdit = false,
}) {
  const [clientId, setClientId] = useState("");
  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!open) return;

    if (agreementToEdit) {
      setClientId(String(agreementToEdit.clientId || ""));
      setFormData({
        file: null,
        issuedDate: agreementToEdit.issuedDate || "",
        expiryDate: agreementToEdit.expiryDate || "",
        status: agreementToEdit.status || "active",
        description: agreementToEdit.description || "",
      });
      setSelectedFile(agreementToEdit.fileId ? agreementToEdit : null);
    } else {
      setClientId(defaultClientId ? String(defaultClientId) : "");
      setFormData(defaultFormData());
      setSelectedFile(null);
    }
    setError(null);
  }, [open, agreementToEdit, defaultClientId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are allowed");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, file }));
      setError(null);
    } else {
      setSelectedFile(null);
      setFormData((prev) => ({ ...prev, file: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client");
      return;
    }

    const { file, issuedDate, expiryDate, status, description } = formData;

    if (!file && !agreementToEdit?.fileId) {
      setError("Please select a PDF file");
      return;
    }

    if (!issuedDate || !expiryDate) {
      setError("Please select both issued and expiry dates");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && agreementToEdit?.id) {
        if (file) {
          const formDataToSend = new FormData();
          formDataToSend.append("file", file);
          formDataToSend.append("id", agreementToEdit.id);
          formDataToSend.append("clientId", clientId);
          formDataToSend.append("issuedDate", issuedDate);
          formDataToSend.append("expiryDate", expiryDate);
          formDataToSend.append("status", status);
          formDataToSend.append("description", description);
          const result = await uploadAgreement(formDataToSend);
          onSuccess(result);
        } else {
          const response = await updateAgreement(agreementToEdit.id, { issuedDate, expiryDate, status, description });
          onSuccess(response.data);
        }
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);
        formDataToSend.append("clientId", clientId);
        formDataToSend.append("issuedDate", issuedDate);
        formDataToSend.append("expiryDate", expiryDate);
        formDataToSend.append("status", status);
        formDataToSend.append("description", description);
        const result = await uploadAgreement(formDataToSend);
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to process agreement");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputClass = "w-full py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white";

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-on-surface">{isEdit ? "Edit Agreement" : "Upload Agreement"}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1" title="Close">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Client *</label>
              {isEdit ? (
                <input
                  type="text"
                  value={clients.find((c) => String(c.id) === clientId)?.name || "Unknown Client"}
                  readOnly
                  className={`${inputClass} bg-gray-50`}
                />
              ) : (
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass} required>
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Agreement File (PDF, Max 2MB)</label>
              <input type="file" accept=".pdf" onChange={handleFileChange} className={inputClass} disabled={loading} />
              {selectedFile?.name && <p className="mt-1 text-sm text-green-600">{selectedFile.name}</p>}
              {!selectedFile && agreementToEdit?.fileId && (
                <p className="text-sm text-secondary">
                  Current file: {agreementToEdit.fileName} ({Math.round((agreementToEdit.fileSize || 0) / 1024)} KB)
                </p>
              )}
              {!selectedFile && !agreementToEdit?.fileId && <p className="text-sm text-secondary">Select a PDF file to upload</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Issued Date</label>
              <input
                type="date"
                value={formData.issuedDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, issuedDate: e.target.value }))}
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className={inputClass}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className={inputClass}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="pending_signature">Pending Signature</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                className={`${inputClass} resize-none`}
                disabled={loading}
                placeholder="Add any additional notes about this agreement"
              />
            </div>
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
              {isEdit ? "Update Agreement" : "Upload Agreement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
