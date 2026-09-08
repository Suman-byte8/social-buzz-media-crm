"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBrandKit, uploadBrandKitBulk, deleteBrandKit } from "@/redux/slices/documentsSlice";
import { getAssetUrl } from "@/services/apiClient";

const formatSize = (bytes) => {
  if (!bytes) return "N/A";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export default function BrandKit({ client, clientId }) {
  const dispatch = useDispatch();
  const { brandKit, loadingBrandKit } = useSelector((state) => state.documents);
  const clientName = client?.name || "Client";
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [brokenThumbs, setBrokenThumbs] = useState({});
  // Synchronous guard, separate from the `uploading` state: a fast
  // double-click can fire handleUpload a second time before React commits
  // the disabled state to the button, dispatching two uploads of the same
  // files and creating duplicate Document rows in Drive/the DB.
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (clientId) {
      dispatch(fetchBrandKit(clientId));
    }
  }, [dispatch, clientId]);

  const handleFileChange = (e) => {
    setError("");
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("clientId", clientId);
      formData.append("documentType", "brand_kit");
      if (description.trim()) formData.append("description", description.trim());

      const result = await dispatch(uploadBrandKitBulk(formData)).unwrap();
      if (result?.failed?.length > 0) {
        setError(
          `${result.failed.length} file(s) failed to upload: ${result.failed.map((f) => f.fileName).join(", ")}`
        );
      }
      setSelectedFiles([]);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to upload files");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this file? It will be moved to the Drive trash and removed from here.")) return;
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
              multiple
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
              disabled={uploading || selectedFiles.length === 0}
              className="shrink-0 px-5 py-2.5 bg-primary hover:bg-surface-tint text-on-primary rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {uploading ? "progress_activity" : "upload"}
              </span>
              {uploading
                ? "Uploading..."
                : selectedFiles.length > 1
                ? `Upload ${selectedFiles.length} Files`
                : "Upload File"}
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedFiles.map((file, idx) => (
                <span
                  key={`${file.name}-${idx}`}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-on-surface"
                >
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(idx)}
                    disabled={uploading}
                    className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
            Select as many files as you need, any format or size — they upload straight to the client&apos;s
            Drive folder, in the Brand Kit subfolder.
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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {brandKit.map((file) => {
              const isImage = file.fileType?.startsWith("image/");
              const thumbBroken = brokenThumbs[file.id];
              // Proxied through our own backend (which fetches the bytes via
              // an authenticated Drive API call) rather than linking straight
              // to Drive's googleUserContentLink — that direct-hotlink URL
              // only works while Drive's "anyone with the link" permission
              // happens to be set, which isn't guaranteed (see the same fix
              // already applied to agency logos via logo-proxy).
              const fileUrl = getAssetUrl(`/api/documents/${file.id}/stream`);
              return (
                <div key={file.id} className="bg-white rounded-lg border border-outline-variant shadow-sm overflow-hidden group">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square bg-surface-container-lowest flex items-center justify-center overflow-hidden"
                  >
                    {isImage && !thumbBroken ? (
                      <img
                        src={fileUrl}
                        alt={file.fileName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={() => setBrokenThumbs((prev) => ({ ...prev, [file.id]: true }))}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[28px] text-on-surface-variant">description</span>
                    )}
                  </a>
                  <div className="p-2">
                    <p className="font-label-sm text-label-sm font-medium text-on-background truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    {file.description && (
                      <p className="text-[10.5px] text-tertiary truncate" title={file.description}>
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10.5px] text-on-surface-variant">{formatSize(file.fileSize)}</span>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
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
