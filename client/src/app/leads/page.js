"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLeads,
  fetchLeadMetrics,
  updateLead,
  deleteLead,
  convertLead,
  createLead,
  clearMessages,
} from "@/redux/slices/leadsSlice";
import LeadsToolbar from "@/components/leads/LeadsToolbar";
import LeadsMetrics from "@/components/leads/LeadsMetrics";
import LeadsFilters from "@/components/leads/LeadsFilters";
import LeadsTable from "@/components/leads/LeadsTable";
import LeadsPagination from "@/components/leads/LeadsPagination";
import EditLeadModal from "@/components/leads/AddEditLeadModal";

const SOURCE_OPTIONS = ["LinkedIn", "Website Organic", "Referral", "Cold Outreach", "Other"];

let draftIdCounter = 0;
const nextDraftId = () => `draft-${Date.now()}-${draftIdCounter++}`;

const blankDraft = () => ({
  tempId: nextDraftId(),
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  source: "",
  status: "new",
  nextFollowUpAt: "",
});

// Minimal CSV parser for the Import button: expects a header row with any
// of companyName, contactName, email, phone, source (case-insensitive,
// order-independent). No external library needed for a handful of columns.
const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] || "";
    });
    return {
      companyName: row.companyname || row.company || "",
      contactName: row.contactname || row.contact || "",
      email: row.email || "",
      phone: row.phone || "",
      source: row.source || "",
    };
  }).filter((row) => row.companyName);
};

export default function LeadsPage() {
  const dispatch = useDispatch();
  const { leads, loading, error, successMessage, totalPages, totalItems, metrics, loadingMetrics } = useSelector((state) => state.leads);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [importing, setImporting] = useState(false);

  const [draftRows, setDraftRows] = useState([]);
  const [savingDraftId, setSavingDraftId] = useState(null);
  const [draftErrors, setDraftErrors] = useState({});

  const queryParams = { page, limit, search, status, source, sortBy: "createdAt", sortOrder: "DESC" };

  useEffect(() => {
    dispatch(fetchLeads(queryParams));
  }, [dispatch, page, limit, search, status, source]);

  useEffect(() => {
    dispatch(fetchLeadMetrics());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const refresh = () => {
    dispatch(fetchLeads(queryParams));
    dispatch(fetchLeadMetrics());
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };
  const handleSourceChange = (value) => {
    setSource(value);
    setPage(1);
  };

  const handleAddNew = () => {
    setDraftRows((prev) => [...prev, blankDraft()]);
  };

  const handleDraftChange = (tempId, field, value) => {
    setDraftRows((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d)));
  };

  const handleDiscardDraft = (tempId) => {
    setDraftRows((prev) => prev.filter((d) => d.tempId !== tempId));
    setDraftErrors((prev) => {
      const next = { ...prev };
      delete next[tempId];
      return next;
    });
  };

  const handleSaveDraft = async (tempId) => {
    const draft = draftRows.find((d) => d.tempId === tempId);
    if (!draft) return;
    if (!draft.companyName.trim()) {
      setDraftErrors((prev) => ({ ...prev, [tempId]: "Company name is required" }));
      return;
    }

    setSavingDraftId(tempId);
    setDraftErrors((prev) => ({ ...prev, [tempId]: undefined }));
    try {
      const payload = {
        ...draft,
        nextFollowUpAt: draft.nextFollowUpAt ? new Date(draft.nextFollowUpAt).toISOString() : null,
      };
      await dispatch(createLead(payload)).unwrap();
      setDraftRows((prev) => prev.filter((d) => d.tempId !== tempId));
      refresh();
    } catch (err) {
      setDraftErrors((prev) => ({ ...prev, [tempId]: (typeof err === "string" ? err : err?.message) || "Failed to save." }));
    } finally {
      setSavingDraftId(null);
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingLead(null);
  };
  const handleModalSuccess = () => {
    handleCloseModal();
    refresh();
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete the lead "${lead.companyName}"? This can't be undone.`)) return;
    await dispatch(deleteLead(lead.id));
    dispatch(fetchLeadMetrics());
  };

  const handleConvert = async (lead) => {
    if (!window.confirm(`Convert "${lead.companyName}" into a client? It will be removed from the leads pipeline.`)) return;
    try {
      await dispatch(convertLead(lead.id)).unwrap();
      dispatch(fetchLeadMetrics());
    } catch (err) {
      alert((typeof err === "string" ? err : err?.message) || "Failed to convert lead.");
    }
  };

  const handleSendEmail = (lead) => {
    if (!lead.email) return;
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(`Regarding ${lead.companyName}`)}`;
    dispatch(updateLead({ id: lead.id, leadData: { lastContactAt: new Date().toISOString() } })).then(refresh);
  };

  const handleLogCall = (lead) => {
    if (!lead.phone) return;
    window.location.href = `tel:${lead.phone}`;
    dispatch(updateLead({ id: lead.id, leadData: { lastContactAt: new Date().toISOString() } })).then(refresh);
  };

  const handleSchedule = (lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleImportFile = async (file) => {
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        alert("No valid rows found. Make sure the CSV has a header row with a companyName column.");
        return;
      }
      for (const row of rows) {
        await dispatch(createLead(row)).unwrap().catch(() => {});
      }
      refresh();
    } catch (err) {
      alert("Failed to read the CSV file.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-container-margin flex-1">
      <LeadsToolbar onImportFile={handleImportFile} importing={importing} onAddNew={handleAddNew} />

      <LeadsMetrics metrics={metrics} loading={loadingMetrics} />

      {(successMessage || error) && (
        <div className={`mb-stack-lg p-4 rounded-lg flex items-center justify-between ${successMessage ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          <span>{successMessage || error}</span>
          <button onClick={() => dispatch(clearMessages())} className="text-lg font-bold leading-none">×</button>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm flex flex-col">
        <LeadsFilters
          search={search}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
          source={source}
          onSourceChange={handleSourceChange}
          sources={SOURCE_OPTIONS}
        />

        <LeadsTable
          leads={leads}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
          onSendEmail={handleSendEmail}
          onLogCall={handleLogCall}
          onSchedule={handleSchedule}
          draftRows={draftRows}
          onDraftChange={handleDraftChange}
          onSaveDraft={handleSaveDraft}
          onDiscardDraft={handleDiscardDraft}
          savingDraftId={savingDraftId}
          draftErrors={draftErrors}
        />

        <LeadsPagination
          page={page}
          limit={limit}
          totalItems={totalItems}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      <EditLeadModal
        isOpen={modalOpen}
        lead={editingLead}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
