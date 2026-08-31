"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "@/redux/slices/clientsSlice";
import {
  fetchContentCalendarEntries,
  createContentCalendarEntry,
  updateContentCalendarEntry,
  deleteContentCalendarEntry,
  uploadCreatives,
  deleteCreative,
  setEntryStatusLocal,
} from "@/redux/slices/contentCalendarSlice";
import ContentCalendarTable from "./ContentCalendarTable";
import ContentCalendarPrintView from "./ContentCalendarPrintView";
import { exportContentCalendarToPdf } from "@/lib/ContentCalendarPdfExport";
import { PLATFORM_OPTIONS, STATUS_OPTIONS } from "./constants";

let draftIdCounter = 0;
const nextDraftId = () => `draft-${Date.now()}-${draftIdCounter++}`;

const blankDraft = (clientId) => ({
  tempId: nextDraftId(),
  clientId: clientId || "",
  date: "",
  holiday: "",
  postTitle: "",
  content: "",
  caption: "",
  hashtags: "",
  platforms: [],
  status: "pending",
  stagedFiles: [],
});

export default function ContentCalendarShell() {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { entries, loading } = useSelector((state) => state.contentCalendar);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");

  const [draftRows, setDraftRows] = useState([]);
  const [savingDraftId, setSavingDraftId] = useState(null);
  const [draftErrors, setDraftErrors] = useState({});
  const [savingAll, setSavingAll] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [editExistingCreatives, setEditExistingCreatives] = useState([]);
  const [editStagedFiles, setEditStagedFiles] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [exporting, setExporting] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, platformFilter, statusFilter, month]);

  const loadEntries = () => {
    const params = {
      clientId: selectedClientId || undefined,
      platform: platformFilter !== "all" ? platformFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    };
    if (month) {
      const [year, m] = month.split("-").map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      params.from = `${month}-01`;
      params.to = `${month}-${String(lastDay).padStart(2, "0")}`;
    }
    dispatch(fetchContentCalendarEntries(params));
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        e.postTitle?.toLowerCase().includes(q) ||
        e.content?.toLowerCase().includes(q) ||
        e.caption?.toLowerCase().includes(q) ||
        e.hashtags?.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const stats = useMemo(() => {
    const total = filteredEntries.length;
    const posted = filteredEntries.filter((e) => e.status === "posted").length;
    const scheduled = filteredEntries.filter((e) => e.status === "scheduled").length;
    const pending = filteredEntries.filter((e) => e.status === "pending" || !e.status).length;
    return { total, posted, scheduled, pending };
  }, [filteredEntries]);

  // ── Bulk add (draft rows) ────────────────────────────────────────────
  const handleAddRow = () => {
    setDraftRows((prev) => [...prev, blankDraft(selectedClientId)]);
  };

  const handleAddRows = (count) => {
    setDraftRows((prev) => [...prev, ...Array.from({ length: count }, () => blankDraft(selectedClientId))]);
  };

  const handleDraftChange = (tempId, field, value) => {
    setDraftRows((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d)));
  };

  const handleDraftTogglePlatform = (tempId, platform) => {
    setDraftRows((prev) =>
      prev.map((d) =>
        d.tempId === tempId
          ? { ...d, platforms: d.platforms.includes(platform) ? d.platforms.filter((p) => p !== platform) : [...d.platforms, platform] }
          : d
      )
    );
  };

  const handleDraftStageFiles = (tempId, files) => {
    setDraftRows((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, stagedFiles: [...d.stagedFiles, ...files] } : d)));
  };

  const handleDraftRemoveStagedFile = (tempId, index) => {
    setDraftRows((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, stagedFiles: d.stagedFiles.filter((_, i) => i !== index) } : d))
    );
  };

  const handleDiscardDraft = (tempId) => {
    setDraftRows((prev) => prev.filter((d) => d.tempId !== tempId));
    setDraftErrors((prev) => {
      const next = { ...prev };
      delete next[tempId];
      return next;
    });
  };

  const persistDraft = async (draft) => {
    if (!draft.clientId) throw new Error("Select a client.");
    if (!draft.date) throw new Error("Pick a date.");

    const payload = {
      clientId: parseInt(draft.clientId),
      date: draft.date,
      holiday: draft.holiday.trim(),
      postTitle: draft.postTitle.trim(),
      content: draft.content.trim(),
      caption: draft.caption.trim(),
      hashtags: draft.hashtags.trim(),
      platforms: draft.platforms,
      status: draft.status,
    };

    const response = await dispatch(createContentCalendarEntry(payload)).unwrap();
    const entryId = response.data.id;

    if (draft.stagedFiles.length > 0) {
      await dispatch(uploadCreatives({ entryId, files: draft.stagedFiles })).unwrap();
    }
  };

  const handleSaveDraft = async (tempId) => {
    const draft = draftRows.find((d) => d.tempId === tempId);
    if (!draft) return;

    setSavingDraftId(tempId);
    setDraftErrors((prev) => ({ ...prev, [tempId]: undefined }));
    try {
      await persistDraft(draft);
      setDraftRows((prev) => prev.filter((d) => d.tempId !== tempId));
      loadEntries();
    } catch (error) {
      setDraftErrors((prev) => ({ ...prev, [tempId]: error?.message || error || "Failed to save." }));
    } finally {
      setSavingDraftId(null);
    }
  };

  const handleSaveAllDrafts = async () => {
    setSavingAll(true);
    const failed = [];
    for (const draft of draftRows) {
      try {
        await persistDraft(draft);
      } catch (error) {
        failed.push(draft.tempId);
        setDraftErrors((prev) => ({ ...prev, [draft.tempId]: error?.message || error || "Failed to save." }));
      }
    }
    setDraftRows((prev) => prev.filter((d) => failed.includes(d.tempId)));
    setSavingAll(false);
    loadEntries();
  };

  // ── Inline edit of an existing entry ────────────────────────────────
  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditValues({
      clientId: entry.clientId,
      date: entry.date,
      holiday: entry.holiday || "",
      postTitle: entry.postTitle || "",
      content: entry.content || "",
      caption: entry.caption || "",
      hashtags: entry.hashtags || "",
      platforms: entry.platforms || [],
      status: entry.status || "pending",
    });
    setEditExistingCreatives(entry.creatives || []);
    setEditStagedFiles([]);
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
    setEditExistingCreatives([]);
    setEditStagedFiles([]);
    setEditError("");
  };

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditTogglePlatform = (platform) => {
    setEditValues((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform) ? prev.platforms.filter((p) => p !== platform) : [...prev.platforms, platform],
    }));
  };

  const handleEditStageFiles = (files) => {
    setEditStagedFiles((prev) => [...prev, ...files]);
  };

  const handleEditRemoveStagedFile = (index) => {
    setEditStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditRemoveExistingCreative = async (fileId) => {
    if (!confirm("Remove this creative?")) return;
    try {
      await dispatch(deleteCreative({ entryId: editingId, fileId })).unwrap();
      setEditExistingCreatives((prev) => prev.filter((c) => c.fileId !== fileId));
    } catch (error) {
      alert(error?.message || error || "Failed to remove creative.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editValues.date) {
      setEditError("Pick a date.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      await dispatch(
        updateContentCalendarEntry({
          id: editingId,
          data: {
            date: editValues.date,
            holiday: editValues.holiday.trim(),
            postTitle: editValues.postTitle.trim(),
            content: editValues.content.trim(),
            caption: editValues.caption.trim(),
            hashtags: editValues.hashtags.trim(),
            platforms: editValues.platforms,
            status: editValues.status,
          },
        })
      ).unwrap();

      if (editStagedFiles.length > 0) {
        await dispatch(uploadCreatives({ entryId: editingId, files: editStagedFiles })).unwrap();
      }

      handleCancelEdit();
      loadEntries();
    } catch (error) {
      setEditError(error?.message || error || "Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete / toggle / share ──────────────────────────────────────────
  const handleDelete = async (entry) => {
    if (!confirm(`Delete the content calendar entry "${entry.postTitle || entry.date}"? This cannot be undone.`)) return;
    try {
      await dispatch(deleteContentCalendarEntry(entry.id)).unwrap();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry.");
    }
  };

  const handleStatusChange = async (entry, nextStatus) => {
    const previousStatus = entry.status;
    dispatch(setEntryStatusLocal({ id: entry.id, status: nextStatus }));
    try {
      await dispatch(updateContentCalendarEntry({ id: entry.id, data: { status: nextStatus } })).unwrap();
    } catch (error) {
      console.error("Error updating status:", error);
      dispatch(setEntryStatusLocal({ id: entry.id, status: previousStatus }));
      alert("Failed to update status.");
    }
  };

  const handleShare = (entry) => {
    const client = clients.find((c) => c.id === entry.clientId);
    const whatsappNumber = client?.whatsappNumber || client?.phoneNumber || "";

    if (!whatsappNumber) {
      alert("No WhatsApp number found for this client.");
      return;
    }

    const cleanedNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const lines = [
      `Content Calendar Entry${entry.postTitle ? `: ${entry.postTitle}` : ""}`,
      `Date: ${entry.date}`,
      entry.caption ? `Caption: ${entry.caption}` : null,
      entry.hashtags ? `Hashtags: ${entry.hashtags}` : null,
      entry.creatives && entry.creatives.length > 0
        ? `Creatives: ${entry.creatives.map((c) => c.webViewLink || c.driveLink).join(", ")}`
        : null,
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${cleanedNumber}?text=${message}`, "_blank");
  };

  // ── PDF export ───────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    if (filteredEntries.length === 0) {
      alert("No entries to export.");
      return;
    }
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const clientLabel = selectedClientId
        ? clients.find((c) => c.id === parseInt(selectedClientId))?.name || "Client"
        : "All Clients";
      const filename = `content-calendar-${clientLabel.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportContentCalendarToPdf(printRef.current, filename);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const printTitle = selectedClientId
    ? clients.find((c) => c.id === parseInt(selectedClientId))?.name || "Client"
    : "All Clients";

  return (
    <div className="flex-1 p-3 lg:p-4 max-w-[1800px] w-full mx-auto">
      <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Content Calendar</h1>
          <p className="text-gray-500 text-xs">Plan, track, and manage every client&apos;s content schedule.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-label-sm text-label-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {exporting ? "progress_activity" : "picture_as_pdf"}
            </span>
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={handleAddRow}
            className="px-3.5 py-1.5 bg-primary text-white rounded-lg font-label-sm text-label-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Row
          </button>
          <button
            onClick={() => handleAddRows(5)}
            className="px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg font-label-sm text-label-sm hover:bg-primary/20 transition-colors flex items-center gap-1"
            title="Add 5 rows at once"
          >
            +5
          </button>
        </div>
      </div>

      {/* Stats + Filters combined into one compact bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 mb-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-2 pr-3 mr-1 border-r border-gray-200">
            <div className="text-center px-1.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none">Total</p>
              <p className="text-base font-bold text-gray-900 leading-tight">{stats.total}</p>
            </div>
            <div className="text-center px-1.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none">Posted</p>
              <p className="text-base font-bold text-green-600 leading-tight">{stats.posted}</p>
            </div>
            <div className="text-center px-1.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none">Scheduled</p>
              <p className="text-base font-bold text-blue-600 leading-tight">{stats.scheduled}</p>
            </div>
            <div className="text-center px-1.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none">Pending</p>
              <p className="text-base font-bold text-amber-600 leading-tight">{stats.pending}</p>
            </div>
          </div>

          <div className="min-w-[130px] flex-1">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[120px]">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="min-w-[110px]">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="all">All Platforms</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[100px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px] flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, caption, hashtags..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {draftRows.length > 0 && (
            <button
              onClick={handleSaveAllDrafts}
              disabled={savingAll}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">
                {savingAll ? "progress_activity" : "save"}
              </span>
              Save All New Rows ({draftRows.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ContentCalendarTable
          entries={filteredEntries}
          loading={loading}
          showClientColumn
          clients={clients}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onShare={handleShare}
          draftRows={draftRows}
          onDraftChange={handleDraftChange}
          onDraftTogglePlatform={handleDraftTogglePlatform}
          onDraftStageFiles={handleDraftStageFiles}
          onDraftRemoveStagedFile={handleDraftRemoveStagedFile}
          onSaveDraft={handleSaveDraft}
          onDiscardDraft={handleDiscardDraft}
          savingDraftId={savingDraftId}
          draftErrors={draftErrors}
          editingId={editingId}
          editValues={editValues}
          editExistingCreatives={editExistingCreatives}
          editStagedFiles={editStagedFiles}
          onEditChange={handleEditChange}
          onEditTogglePlatform={handleEditTogglePlatform}
          onEditStageFiles={handleEditStageFiles}
          onEditRemoveStagedFile={handleEditRemoveStagedFile}
          onEditRemoveExistingCreative={handleEditRemoveExistingCreative}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          savingEdit={savingEdit}
          editError={editError}
        />
      </div>

      {/* Off-screen printable snapshot used for PDF export */}
      <div style={{ position: "fixed", top: 0, left: "-99999px", zIndex: -1 }}>
        <div ref={printRef}>
          <ContentCalendarPrintView entries={filteredEntries} title={printTitle} showClientColumn />
        </div>
      </div>
    </div>
  );
}
