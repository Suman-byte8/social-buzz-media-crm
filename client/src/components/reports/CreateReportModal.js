"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchReportTemplates, createReport } from "@/redux/slices/reportsSlice";
import ClientSelectDropdown from "@/components/invoices/ClientSelectDropdown";

// Mounted only while open (see ReportsDashboard.js), rather than taking an
// `open` prop and resetting its fields in an effect each time — a fresh
// mount gets fresh initial state for free, no reset effect needed.
export default function CreateReportModal({ onClose }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const rawClients = useSelector((s) => s.clients.clients);
  const isClientLoading = useSelector((s) => s.clients.loading);
  const templates = useSelector((s) => s.reports.templates);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null); // { key } or { id }
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const clients = useMemo(
    () => (Array.isArray(rawClients) ? rawClients.map((c) => ({ id: c.id, name: c.name || c.clientName || "" })) : []),
    [rawClients]
  );

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchReportTemplates());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const payload = { clientId: selectedClientId, title: title.trim() || undefined };
      if (selectedTemplate?.id) payload.templateId = selectedTemplate.id;
      else payload.templateKey = selectedTemplate?.key || "blank";

      const res = await dispatch(createReport(payload)).unwrap();
      onClose();
      router.push(`/reports/${res.data.id}`);
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
              placeholder="Defaults to the template's title"
              className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={creating} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !selectedClientId}
            className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
