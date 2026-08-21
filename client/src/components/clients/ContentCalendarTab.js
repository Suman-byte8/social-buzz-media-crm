"use client";

import React, { useState, useEffect } from "react";
import { fetchDocumentsByClient, deleteDocument } from "@/services/documentService";

export default function ContentCalendarTab({ clientId, clientName }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (clientId) {
      loadDocuments();
    }
  }, [clientId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetchDocumentsByClient(clientId);
      const docs = response.data || response || [];
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.fileName}"? This action cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocuments(documents.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">description</span>
          Content Documents
        </h3>
        <a
          href="/calendar"
          className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          Upload New
        </a>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">
          <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
        </div>
      ) : documents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2 px-3 font-label-sm text-label-sm text-gray-700">File</th>
                <th className="py-2 px-3 font-label-sm text-label-sm text-gray-700">Size</th>
                <th className="py-2 px-3 font-label-sm text-label-sm text-gray-700">Uploaded</th>
                <th className="py-2 px-3 font-label-sm text-label-sm text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-500 text-[20px]">picture_as_pdf</span>
                      <div>
                        <a
                          href={doc.googleUserContentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body-sm text-body-sm text-blue-600 hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        {doc.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-body-sm text-gray-600">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="py-2 px-3 text-body-sm text-gray-600">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/documents/${doc.id}/stream`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-600 hover:text-primary hover:bg-gray-100 rounded"
                        title="View PDF"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-6 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
          <span className="material-symbols-outlined text-[32px] mb-2">document_scanner</span>
          <p className="font-body-sm text-body-sm">No content documents uploaded for {clientName}.</p>
        </div>
      )}
    </div>
  );
}
