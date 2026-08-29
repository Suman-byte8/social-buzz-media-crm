"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBrandKit, uploadBrandKit, deleteBrandKit } from "@/redux/slices/documentsSlice";
import { getAssetUrl } from "@/services/apiClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatSize = (bytes) => {
  if (!bytes) return "N/A";
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export default function BrandKit({ client, clientId }) {
  const dispatch = useDispatch();
  const { brandKit, loadingBrandKit } = useSelector((state) => state.documents);
  const clientName = client?.name || "Client";
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clientId) {
      dispatch(fetchBrandKit(clientId));
    }
  }, [dispatch, clientId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Only image or PDF files are allowed");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("clientId", clientId);
      formData.append("documentType", "brand_kit");
      if (description.trim()) formData.append("description", description.trim());

      await dispatch(uploadBrandKit(formData)).unwrap();
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this file? This will not remove it from Google Drive.")) return;
    dispatch(deleteBrandKit(id));
  };

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
              Brand Kit
              <span className="material-symbols-outlined text-primary text-xl">palette</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Logos, brand colors, and other brand imagery for {clientName}, stored in the client&apos;s Drive folder.
            </p>
          </div>
        </section>

        {/* Upload bar */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="flex-1 text-body-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-surface-container file:text-on-surface file:font-label-sm file:cursor-pointer"
            />
            <input
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Label (e.g. Primary Logo, Brand Colors)"
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
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
            Images or PDF, up to 10MB. Files upload to the client&apos;s Drive folder, in the Brand Kit subfolder.
          </p>
          {error && <p className="text-red-600 font-body-sm text-body-sm mt-2">{error}</p>}
        </div>

        {/* Gallery */}
        {loadingBrandKit ? (
          <div className="py-12 text-center text-on-surface-variant">
            <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
          </div>
        ) : brandKit.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">palette</span>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2">No Brand Kit Files Yet</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Upload {clientName}&apos;s logo, brand colors, or other brand imagery above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {brandKit.map((file) => {
              const isImage = file.fileType?.startsWith("image/");
              // Proxied through our own backend (which fetches the bytes via
              // an authenticated Drive API call) rather than linking straight
              // to Drive's googleUserContentLink — that direct-hotlink URL
              // only works while Drive's "anyone with the link" permission
              // happens to be set, which isn't guaranteed (see the same fix
              // already applied to agency logos via logo-proxy).
              const fileUrl = getAssetUrl(`/api/documents/${file.id}/stream`);
              return (
                <div key={file.id} className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden group">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square bg-surface-container-lowest flex items-center justify-center overflow-hidden"
                  >
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={file.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[48px] text-on-surface-variant">description</span>
                    )}
                  </a>
                  <div className="p-3">
                    <p className="font-body-sm text-body-sm font-medium text-on-background truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    {file.description && (
                      <p className="font-label-sm text-label-sm text-tertiary truncate" title={file.description}>
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{formatSize(file.fileSize)}</span>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
