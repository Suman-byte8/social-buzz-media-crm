"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeadDocuments, uploadLeadDocuments, deleteLeadDocument } from "@/redux/slices/documentsSlice";
import ShareMenu from "@/components/ui/ShareMenu";
import { shareLeadDocumentByEmail, shareLeadDocumentByWhatsApp } from "@/lib/leadDocumentShare";

// Documents live directly in their own table column (not tucked behind an
// Actions-menu popover) so they're visible at a glance and a proposal can
// be uploaded/shared without leaving the row. Each file is its own small
// card with its own Share menu, since different documents can go to
// different people at different times.
export default function LeadDocumentsCell({ lead }) {
  const dispatch = useDispatch();
  const leadId = lead.id;
  const files = useSelector((state) => state.documents.filesByLeadId[leadId] || []);
  const loading = useSelector((state) => state.documents.loadingByLeadId[leadId] || false);
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [sharingId, setSharingId] = useState(null);
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (leadId) dispatch(fetchLeadDocuments(leadId));
  }, [dispatch, leadId]);

  const handlePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const picked = Array.from(e.target.files || []);
    const pdfFiles = picked.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      if (picked.length > 0) alert("Only PDF files can be shared.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    try {
      const formData = new FormData();
      pdfFiles.forEach((file) => formData.append("files", file));
      formData.append("leadId", leadId);
      const result = await dispatch(uploadLeadDocuments({ formData, leadId })).unwrap();
      if (result?.failed?.length > 0) {
        alert(`${result.failed.length} file(s) failed to upload: ${result.failed.map((f) => f.fileName).join(", ")}`);
      }
    } catch (err) {
      alert((typeof err === "string" ? err : err?.message) || "Failed to upload files");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this document? It will be moved to the Drive trash.")) return;
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
    <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
      {loading && files.length === 0 && (
        <span className="material-symbols-outlined animate-spin text-[16px] text-on-surface-variant">progress_activity</span>
      )}

      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-1 pl-2 pr-1 py-1 bg-surface-container rounded-lg border border-outline-variant/60"
        >
          <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">picture_as_pdf</span>
          <span className="font-label-sm text-label-sm text-on-surface truncate max-w-[110px]" title={file.fileName}>
            {file.fileName}
          </span>
          <ShareMenu
            client={lead}
            isSending={sharingId === file.id}
            onSendWhatsApp={(phoneNumber) => handleSendWhatsApp(file, phoneNumber)}
            onSendEmail={() => handleSendEmail(file)}
            shareLabel={`Share ${file.fileName}`}
            busyText="Sharing…"
            variant="light"
          />
          <button
            type="button"
            onClick={() => handleDelete(file.id)}
            className="p-1 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handlePick}
        disabled={uploading}
        title="Upload PDF documents"
        className="flex items-center gap-1 px-2 py-1 border border-dashed border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
      >
        <span className={`material-symbols-outlined text-[16px] ${uploading ? "animate-spin" : ""}`}>{uploading ? "progress_activity" : "add"}</span>
        <span className="font-label-sm text-label-sm">{uploading ? "Uploading…" : "Add"}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
