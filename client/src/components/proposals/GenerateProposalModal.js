"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchProposalTemplates, createProposalDraft } from "@/redux/slices/proposalsSlice";
import ClientSelectDropdown from "@/components/invoices/ClientSelectDropdown";

// Mirrors GenerateAgreementModal.js — mounted only while open (see
// ProposalTab.js), a fresh mount gets fresh initial state for free.
export default function GenerateProposalModal({ onClose, defaultClientId }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const rawClients = useSelector((s) => s.clients.clients);
  const isClientLoading = useSelector((s) => s.clients.loading);
  const templates = useSelector((s) => s.proposals.templates);

  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ? String(defaultClientId) : "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null); // null = master template
  const [title, setTitle] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const clients = useMemo(
    () => (Array.isArray(rawClients) ? rawClients.map((c) => ({ id: c.id, name: c.name || c.clientName || "" })) : []),
    [rawClients]
  );

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchProposalTemplates());
  }, [dispatch]);

  const selectedClient = rawClients?.find((c) => String(c.id) === String(selectedClientId));
  const missingFields = selectedClient ? [!selectedClient.legalName && "legal name", !selectedClient.contactPersonName && "contact person"].filter(Boolean) : [];

  const handleCreate = async () => {
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await dispatch(
        createProposalDraft({ clientId: selectedClientId, templateId: selectedTemplateId, title: title.trim() || undefined, dateOfIssue: dateOfIssue || undefined })
      ).unwrap();
      onClose();
      router.push(`/proposals/${res.data.id}/edit`);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Failed to create proposal");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !creating && onClose()}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Generate Proposal</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">Starts from the SBM Proposal template with the client&apos;s details pre-filled.</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">{error}</p>}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Client</label>
            <ClientSelectDropdown clients={clients} isClientLoading={isClientLoading} selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
            {missingFields.length > 0 && (
              <p className="mt-1.5 text-[11px] text-amber-700">
                This client has no {missingFields.join(", ")} on file — the proposal will show a blank for those; you can fill them in the editor or add them to the client record.
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
              placeholder="Defaults to {Client} Proposal"
              className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Date of issue (optional)</label>
            <input
              type="date"
              value={dateOfIssue}
              onChange={(e) => setDateOfIssue(e.target.value)}
              className="w-full rounded-md border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-[11px] text-on-surface-variant">Defaults to today. &quot;Valid until&quot; is set automatically to 15 days after this date.</p>
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
            {creating ? "Creating…" : "Generate Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
