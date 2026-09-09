"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeadDocuments, uploadLeadDocuments, deleteLeadDocument } from "@/redux/slices/documentsSlice";
import ShareMenu from "@/components/ui/ShareMenu";
import { shareLeadDocumentByEmail, shareLeadDocumentByWhatsApp } from "@/lib/leadDocumentShare";

const formatSize = (bytes) => {
  if (!bytes) return "N/A";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

// Multi-file PDF upload + list, mirroring the Client Files pattern
// (ClientFilesTab.js) but keyed by leadId and restricted to PDFs — proposals
// and agreements shared with a lead before it converts to a client. Files
// upload straight into a per-lead Drive subfolder (see documentRoutes.js).
export default function LeadDocumentsPanel({ lead }) {
  const dispatch = useDispatch();
  const leadId = lead?.id;
  const files = useSelector((state) => state.documents.filesByLeadId[leadId] || []);
  const loading = useSelector((state) => state.documents.loadingByLeadId[leadId] || false);
  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sharingId, setSharingId] = useState(null);
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (leadId) dispatch(fetchLeadDocuments(leadId));
  }, [dispatch, leadId]);

  const handleFileChange = (e) => {
    setError("");
    const picked = Array.from(e.target.files || []);
    const nonPdf = picked.filter((f) => f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"));
    if (nonPdf.length > 0) {
      setError(`Only PDF files can be shared: ${nonPdf.map((f) => f.name).join(", ")}`);
    }
    setSelectedFiles(picked.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")));
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one PDF file");
      return;
    }
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("leadId", leadId);

      const result = await dispatch(uploadLeadDocuments({ formData, leadId })).unwrap();
      if (result?.failed?.length > 0) {
        setError(`${result.failed.length} file(s) failed to upload: ${result.failed.map((f) => f.fileName).join(", ")}`);
      }
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to upload files");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this document? It will be moved to the Drive trash and removed from here.")) return;
    dispatch(deleteLeadDocument({ id, leadId }));
  };

  const handleSendWhatsApp = async (document, phoneNumber) => {
    setSharingId(document.id);
    try {
      await shareLeadDocumentByWhatsApp(document, phoneNumber);
    } catch (err) {
      alert(err.message || "Could not share the document via WhatsApp. Please try again.");
    } finally {
      setSharingId(null);
    }
  };

  const handleSendEmail = async (document) => {
    setSharingId(document.id);
    try {
      const result = await shareLeadDocumentByEmail(document, lead.email);
      if (result.method === "attachment") alert(`Document emailed to ${lead.email}.`);
    } catch (err) {
      alert(err.message || "Could not send the document email. Please try again.");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4 mt-1">
      <p className="block font-label-sm text-label-sm text-secondary mb-2">Documents (proposals, agreements)</p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="flex-1 text-body-sm text-on-surface-variant file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-surface-container file:text-on-surface file:font-label-sm file:cursor-pointer"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="shrink-0 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">{uploading ? "progress_activity" : "upload"}</span>
          {uploading ? "Uploading..." : selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : "Upload"}
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedFiles.map((file, idx) => (
            <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-on-surface">
              {file.name}
              <button type="button" onClick={() => removeSelectedFile(idx)} disabled={uploading} className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors" title="Remove">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-red-600 font-body-sm text-body-sm mt-2">{error}</p>}

      <div className="mt-3">
        {loading ? (
          <p className="text-body-sm text-on-surface-variant py-2">
            <span className="animate-spin material-symbols-outlined text-[16px] align-middle mr-1">progress_activity</span>
            Loading documents...
          </p>
        ) : files.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant py-1">No documents shared with this lead yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto border border-outline-variant rounded-lg">
            {files.map((file) => (
              <li key={file.id} className="flex items-center gap-2 px-3 py-2">
                <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">picture_as_pdf</span>
                <div className="flex-1 min-w-0">
                  <p className="font-label-sm text-label-sm text-on-surface truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">{formatSize(file.fileSize)}</p>
                </div>
                <ShareMenu
                  client={lead}
                  isSending={sharingId === file.id}
                  onSendWhatsApp={(phoneNumber) => handleSendWhatsApp(file, phoneNumber)}
                  onSendEmail={() => handleSendEmail(file)}
                  shareLabel={`Share ${file.fileName}`}
                  busyText="Sharing document…"
                  variant="light"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
