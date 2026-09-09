"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClientFiles, uploadClientFiles, deleteClientFile } from "@/redux/slices/documentsSlice";
import { getAssetUrl } from "@/services/apiClient";
import AddStrategyLinkModal from "@/components/clients/AddStrategyLinkModal";

const DOCUMENT_TYPE = "strategy";

const formatSize = (bytes) => {
  if (!bytes) return "N/A";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const TIME_RANGES = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

const TYPE_FILTERS = [
  { id: "all", label: "All Types" },
  { id: "google_sheet", label: "Google Sheets" },
  { id: "google_doc", label: "Google Docs" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "pdf", label: "PDFs" },
  { id: "other", label: "Other" },
];

// Links (linkType set) are their own categories; uploaded files fall back
// to the same content-sniffing ClientFilesTab.js uses.
const fileTypeOf = (file) => {
  if (file.linkType) return file.linkType;
  const fileType = file.fileType;
  if (!fileType) return "other";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType === "application/pdf") return "pdf";
  return "other";
};

const isWithinTimeRange = (date, range) => {
  if (range === "all") return true;
  const now = new Date();
  if (range === "today") return date.toDateString() === now.toDateString();
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (range === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (range === "year") return date.getFullYear() === now.getFullYear();
  return true;
};

const LINK_CARD_STYLE = {
  google_sheet: { icon: "table_chart", bg: "bg-emerald-50", text: "text-emerald-600", label: "Google Sheet" },
  google_doc: { icon: "description", bg: "bg-blue-50", text: "text-blue-600", label: "Google Doc" },
};

// Rebuilt from ClientFilesTab.js (the generic file-tab this used to be)
// with two extra "kinds" of entry mixed into the same list: shared Google
// Sheet/Doc links, alongside the regular Drive file uploads. A link entry
// is a Document row with linkUrl/linkType set and no fileId (see
// documentRoutes.js's POST /documents/link) — it opens the external URL
// directly instead of going through this app's file-stream proxy.
export default function StrategyTab({ client, clientId }) {
  const dispatch = useDispatch();
  const files = useSelector((state) => state.documents.filesByType[DOCUMENT_TYPE] || []);
  const loading = useSelector((state) => state.documents.loadingFilesByType[DOCUMENT_TYPE] || false);
  const clientName = client?.name || "Client";
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [brokenThumbs, setBrokenThumbs] = useState({});
  const uploadingRef = useRef(false);
  const [linkModalType, setLinkModalType] = useState(null); // null | "google_sheet" | "google_doc"

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (clientId) {
      dispatch(fetchClientFiles({ clientId, documentType: DOCUMENT_TYPE }));
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
      formData.append("documentType", DOCUMENT_TYPE);
      if (description.trim()) formData.append("description", description.trim());

      const result = await dispatch(uploadClientFiles({ formData, documentType: DOCUMENT_TYPE })).unwrap();
      if (result?.failed?.length > 0) {
        setError(`${result.failed.length} file(s) failed to upload: ${result.failed.map((f) => f.fileName).join(", ")}`);
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
    if (!window.confirm("Delete this? Uploaded files are moved to the Drive trash; links are just removed from here.")) return;
    dispatch(deleteClientFile({ id, documentType: DOCUMENT_TYPE }));
  };

  const monthOptions = useMemo(() => {
    const seen = new Map();
    files.forEach((file) => {
      if (!file.createdAt) return;
      const date = new Date(file.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!seen.has(key)) {
        seen.set(key, date.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
      }
    });
    return Array.from(seen.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, label]) => ({ key, label }));
  }, [files]);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((file) => {
      if (q && !file.fileName?.toLowerCase().includes(q) && !file.description?.toLowerCase().includes(q)) {
        return false;
      }
      if (typeFilter !== "all" && fileTypeOf(file) !== typeFilter) return false;

      if (!file.createdAt) return monthFilter === "all" && timeFilter === "all";
      const date = new Date(file.createdAt);

      if (monthFilter !== "all") {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (key !== monthFilter) return false;
      }
      if (!isWithinTimeRange(date, timeFilter)) return false;

      return true;
    });
  }, [files, search, monthFilter, timeFilter, typeFilter]);

  const filtersActive = search || monthFilter !== "all" || timeFilter !== "all" || typeFilter !== "all";

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
              Strategy
              <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Strategy documents and shared Google Sheets/Docs for {clientName}, stored in the client&apos;s Drive folder.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLinkModalType("google_sheet")}
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              Add Google Sheet
            </button>
            <button
              type="button"
              onClick={() => setLinkModalType("google_doc")}
              className="px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              Add Google Doc
            </button>
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
              placeholder="Label (optional)"
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
              <span className="material-symbols-outlined text-[18px]">{uploading ? "progress_activity" : "upload"}</span>
              {uploading ? "Uploading..." : selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : "Upload File"}
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
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

          <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
            Select as many files as you need, any format or size — they upload straight to the client&apos;s Drive folder,
            in the Strategy subfolder. Or share a Google Sheet/Doc link above instead of uploading a file.
          </p>
          {error && <p className="text-red-600 font-body-sm text-body-sm mt-2">{error}</p>}
        </div>

        {/* Filters */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or label..."
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>

            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              <option value="all">All Months</option>
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>

            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              {TIME_RANGES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              {TYPE_FILTERS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            {filtersActive && (
              <button
                onClick={() => {
                  setSearch("");
                  setMonthFilter("all");
                  setTimeFilter("all");
                  setTypeFilter("all");
                }}
                className="px-3 py-2 text-secondary hover:text-primary font-label-sm text-label-sm transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="py-12 text-center text-on-surface-variant">
            <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">lightbulb</span>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2">No Strategy Files Yet</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Upload strategy documents or share a Google Sheet/Doc link for {clientName} above.
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">filter_alt_off</span>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2">No files match these filters</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Try clearing a filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredFiles.map((file) => {
              const linkStyle = file.linkType ? LINK_CARD_STYLE[file.linkType] : null;

              if (linkStyle) {
                return (
                  <div key={file.id} className="bg-white rounded-lg border border-outline-variant shadow-sm overflow-hidden group">
                    <a
                      href={file.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block aspect-square ${linkStyle.bg} flex items-center justify-center`}
                    >
                      <span className={`material-symbols-outlined text-[32px] ${linkStyle.text}`}>{linkStyle.icon}</span>
                    </a>
                    <div className="p-2">
                      <p className="font-label-sm text-label-sm font-medium text-on-background truncate" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className={`text-[10.5px] ${linkStyle.text} truncate`}>{linkStyle.label}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <a href={file.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[10.5px] text-primary hover:underline">
                          Open link
                        </a>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              const isImage = file.fileType?.startsWith("image/");
              const thumbBroken = brokenThumbs[file.id];
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
                      <p className="text-[10.5px] text-tertiary truncate" title={file.description}>{file.description}</p>
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

      <AddStrategyLinkModal
        isOpen={Boolean(linkModalType)}
        onClose={() => setLinkModalType(null)}
        linkType={linkModalType}
        clientId={clientId}
        documentType={DOCUMENT_TYPE}
      />
    </main>
  );
}
