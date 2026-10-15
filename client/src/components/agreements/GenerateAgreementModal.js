"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchAgreementTemplates, createAgreementDraft } from "@/redux/slices/agreementsSlice";
import ClientSelectDropdown from "@/components/invoices/ClientSelectDropdown";

// Mounted only while open (see AgreementsToolbar.js), rather than taking an
// `open` prop and resetting fields in an effect each time — a fresh mount
// gets fresh initial state for free, same pattern CreateReportModal.js uses.
export default function GenerateAgreementModal({ onClose, defaultClientId }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const rawClients = useSelector((s) => s.clients.clients);
  const isClientLoading = useSelector((s) => s.clients.loading);
  const templates = useSelector((s) => s.agreements.templates);

  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ? String(defaultClientId) : "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null); // null = master template
  const [title, setTitle] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const clients = useMemo(
    () => (Array.isArray(rawClients) ? rawClients.map((c) => ({ id: c.id, name: c.name || c.clientName || "" })) : []),
    [rawClients]
  );

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchAgreementTemplates());
  }, [dispatch]);

  const selectedClient = rawClients?.find((c) => String(c.id) === String(selectedClientId));
  const missingFields = selectedClient
    ? [!selectedClient.legalName && "legal name", !selectedClient.contactPersonName && "contact person", !selectedClient.gstin && "GSTIN"].filter(Boolean)
    : [];

  const handleCreate = async () => {
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await dispatch(
        createAgreementDraft({ clientId: selectedClientId, templateId: selectedTemplateId, title: title.trim() || undefined, effectiveDate: effectiveDate || undefined })
      ).unwrap();
      onClose();
      router.push(`/agreements/${res.data.id}/edit`);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Failed to create agreement");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !creating && onClose()}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Generate Agreement</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">Starts from the SBM Service Agreement template with the client&apos;s details pre-filled.</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Client</label>
            <ClientSelectDropdown clients={clients} isClientLoading={isClientLoading} selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
            {missingFields.length > 0 && (
              <p className="mt-1.5 text-[11px] text-amber-700">
                This client has no {missingFields.join(", ")} on file — the agreement will show a blank for those; you can fill them in the editor or add them to the client record.
              </p>
            )}
          </div>

          {templates.length > 1 && (
            <div>
              <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Template</label>
              <select
                value={selectedTemplateId || ""}
                onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {templates.map((t) => (
                  <option key={t.id ?? t.key} value={t.id || ""}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Defaults to {Client} Service Agreement"
              className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Effective date (optional)</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
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
            {creating ? "Creating…" : "Generate Agreement"}
          </button>
        </div>
      </div>
    </div>
  );
}
