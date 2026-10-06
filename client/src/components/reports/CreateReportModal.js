"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchReportTemplates, createReport, autoGenerateReport } from "@/redux/slices/reportsSlice";
import ClientSelectDropdown from "@/components/invoices/ClientSelectDropdown";

// Matches the backend's MAX_IMAGES_TOTAL (geminiVision.js) — large uploads
// are batched server-side (≤10 images per Gemini call) rather than sent as
// one request, so this is a sane upper bound on total generation time/Drive
// uploads per click, not a Gemini request-size limit.
const MAX_SCREENSHOTS = 60;

// Mounted only while open (see ReportsDashboard.js), rather than taking an
// `open` prop and resetting its fields in an effect each time — a fresh
// mount gets fresh initial state for free, no reset effect needed.
export default function CreateReportModal({ onClose }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const rawClients = useSelector((s) => s.clients.clients);
  const isClientLoading = useSelector((s) => s.clients.loading);
  const templates = useSelector((s) => s.reports.templates);

  const [mode, setMode] = useState("template"); // "template" | "auto"
  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null); // { key } or { id }
  const [screenshots, setScreenshots] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const clients = useMemo(
    () => (Array.isArray(rawClients) ? rawClients.map((c) => ({ id: c.id, name: c.name || c.clientName || "" })) : []),
    [rawClients]
  );

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchReportTemplates());
  }, [dispatch]);

  const addScreenshots = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith("image/"));
    if (files.length === 0) return;
    setScreenshots((prev) => {
      const combined = [...prev, ...files];
      if (combined.length > MAX_SCREENSHOTS) {
        setError(`Only the first ${MAX_SCREENSHOTS} screenshots were kept — that's the limit per report.`);
      } else if (error) {
        setError("");
      }
      return combined.slice(0, MAX_SCREENSHOTS);
    });
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items.filter((item) => item.kind === "file" && item.type.startsWith("image/")).map((item) => item.getAsFile()).filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      addScreenshots(files);
    }
  };

  const handleCreateFromTemplate = async () => {
    const payload = { clientId: selectedClientId, title: title.trim() || undefined };
    if (selectedTemplate?.id) payload.templateId = selectedTemplate.id;
    else payload.templateKey = selectedTemplate?.key || "blank";

    const res = await dispatch(createReport(payload)).unwrap();
    return res.data.id;
  };

  const handleAutoGenerate = async () => {
    if (screenshots.length === 0) {
      throw new Error("Please add at least one screenshot.");
    }
    const res = await dispatch(autoGenerateReport({ clientId: selectedClientId, title: title.trim() || undefined, files: screenshots })).unwrap();
    if (!res.data.aiGenerated) {
      window.alert(
        `Your screenshots were uploaded and added to the report, but AI analysis didn't work (${res.data.aiError || "unknown error"}). They're arranged as a plain gallery — rearrange, caption, or add headings manually in the editor.`
      );
    }
    return res.data.report.id;
  };

  const handleCreate = async () => {
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const reportId = mode === "auto" ? await handleAutoGenerate() : await handleCreateFromTemplate();
      onClose();
      router.push(`/reports/${reportId}`);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Failed to create report");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Create New Report</h2>

        <div className="mt-3 flex rounded-full border border-outline-variant bg-surface-container-lowest p-0.5 text-body-sm">
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`flex-1 rounded-full py-1.5 font-label-md text-label-md transition-colors ${mode === "template" ? "bg-primary text-white" : "text-on-surface-variant"}`}
          >
            Start from a template
          </button>
          <button
            type="button"
            onClick={() => setMode("auto")}
            className={`flex-1 rounded-full py-1.5 font-label-md text-label-md transition-colors ${mode === "auto" ? "bg-primary text-white" : "text-on-surface-variant"}`}
          >
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]">auto_awesome</span>
            Auto-generate from screenshots
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Client</label>
            <ClientSelectDropdown clients={clients} isClientLoading={isClientLoading} selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
          </div>

          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Report title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "auto" ? "Let AI suggest one from your screenshots" : "Defaults to the template's title"}
              className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {mode === "template" ? (
            <div>
              <label className="mb-2 block font-label-sm text-label-sm text-on-surface-variant">Template</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {templates.map((t) => {
                  const key = t.isBuiltIn ? `builtin-${t.key}` : `saved-${t.id}`;
                  const isSelected = t.isBuiltIn ? selectedTemplate?.key === t.key : selectedTemplate?.id === t.id;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTemplate(t.isBuiltIn ? { key: t.key } : { id: t.id })}
                      className={`rounded-lg border-2 p-3 text-left transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary">{t.isBuiltIn ? "description" : "bookmark"}</span>
                      <p className="mt-1 font-label-md text-label-md text-on-surface">{t.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-on-surface-variant">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block font-label-sm text-label-sm text-on-surface-variant">Screenshots</label>
              <p className="mb-2 text-[11px] text-on-surface-variant">
                Paste or upload analytics/social screenshots — AI groups them into pages, writes headings and a short summary for each, and
                extracts any clearly legible numbers as KPI cards. Review and edit everything afterward in the normal editor.
              </p>
              <div
                tabIndex={0}
                onPaste={handlePaste}
                onDrop={(e) => {
                  e.preventDefault();
                  addScreenshots(e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[90px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant px-4 py-6 text-center hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant">add_photo_alternate</span>
                <span className="text-body-sm text-on-surface-variant">Click to upload, drag &amp; drop, or paste (Ctrl+V)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addScreenshots(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
              {screenshots.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {screenshots.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-surface-container py-1 pl-2.5 pr-1 text-label-sm font-label-sm text-on-surface">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setScreenshots((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-full p-0.5 hover:bg-red-100 hover:text-red-600"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={creating} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !selectedClientId || (mode === "auto" && screenshots.length === 0)}
            className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? (mode === "auto" ? "Generating…" : "Creating…") : mode === "auto" ? "Generate Report" : "Create Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
