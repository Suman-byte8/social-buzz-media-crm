"use client";

import React, { useState, useEffect } from "react";
import { fetchClients } from "@/services/clientService";
import { fetchDocumentsByClient, uploadDocument, deleteDocument } from "@/services/documentService";

export default function ContentCalendarShell({ clients: initialClients }) {
  const [clients, setClients] = useState(initialClients || []);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  useEffect(() => {
    if (!clients || clients.length === 0) {
      loadClients();
    }
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetchClients({ limit: 100 });
      const clientList = response.data || response || [];
      setClients(clientList);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      loadDocuments(selectedClientId);
    } else {
      setDocuments([]);
    }
  }, [selectedClientId]);

  const loadDocuments = async (clientId) => {
    try {
      const response = await fetchDocumentsByClient(clientId);
      const docList = response.data || response || [];
      setDocuments(docList);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setUploadError("");
    } else if (file && file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed.");
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    if (!selectedFile) {
      setUploadError("Please select a PDF file.");
      return;
    }
    if (!selectedClientId) {
      setUploadError("Please select a client.");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadDocument(selectedFile, selectedClientId, description);
      if (response.success) {
        setUploadSuccess("Document uploaded successfully!");
        setSelectedFile(null);
        setDescription("");
        e.target.reset();
        loadDocuments(selectedClientId);
      }
    } catch (error) {
      setUploadError(error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document.");
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
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
        <p className="text-gray-600 mt-1">Upload and manage content documents linked to clients.</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Upload PDF Document
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {uploadSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Choose a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
                PDF File
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">{selectedFile.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this document..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              rows="3"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <span className="animate-spin">
                  <span className="material-symbols-outlined text-[16px]">progress_activity</span>
                </span>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">publish</span>
                Upload Document
              </>
            )}
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">folder_open</span>
            Documents for: {clients.find((c) => c.id === parseInt(selectedClientId))?.name || "All Clients"}
          </h2>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 font-label-sm text-label-sm text-gray-700 uppercase tracking-wider">File</th>
                  <th className="py-3 px-4 font-label-sm text-label-sm text-gray-700 uppercase tracking-wider">Size</th>
                  <th className="py-3 px-4 font-label-sm text-label-sm text-gray-700 uppercase tracking-wider">Client</th>
                  <th className="py-3 px-4 font-label-sm text-label-sm text-gray-700 uppercase tracking-wider">Drive Folder</th>
                  <th className="py-3 px-4 font-label-sm text-label-sm text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 font-label-sm text-label-sm text-gray-700 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[28px]">picture_as_pdf</span>
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
                    <td className="py-3 px-4 text-body-sm text-gray-600">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-body-sm text-gray-600">
                      {clients.find((c) => c.id === doc.clientId)?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-body-sm text-gray-600">
                      {doc.folderId ? (
                        <a
                          href={`https://drive.google.com/drive/folders/${doc.folderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          title="View in Google Drive"
                        >
                          <span className="material-symbols-outlined text-[14px]">folder</span>
                          View Folder
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-body-sm text-gray-600">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/documents/${doc.id}/stream`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-600 hover:text-primary hover:bg-gray-100 rounded"
                          title="View PDF"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 px-6 text-center text-gray-500">
            <span className="material-symbols-outlined text-[48px] mb-2">document_scanner</span>
            <p className="font-body-sm text-body-sm">No documents found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
