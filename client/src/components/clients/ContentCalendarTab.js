"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContentCalendarEntries,
  createContentCalendarEntry,
  updateContentCalendarEntry,
  deleteContentCalendarEntry,
  uploadCreatives,
  deleteCreative,
  setEntryStatusLocal,
} from "@/redux/slices/contentCalendarSlice";
import ContentCalendarTable from "@/components/content-calendar/ContentCalendarTable";
import ContentCalendarPrintView from "@/components/content-calendar/ContentCalendarPrintView";
import { exportContentCalendarToPdf } from "@/lib/ContentCalendarPdfExport";

let draftIdCounter = 0;
const nextDraftId = () => `draft-${Date.now()}-${draftIdCounter++}`;

const blankDraft = (clientId) => ({
  tempId: nextDraftId(),
  clientId,
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

export default function ContentCalendarTab({ clientId, client }) {
  const clientName = client?.name || "";

  const dispatch = useDispatch();
  const { entries, loading } = useSelector((state) => state.contentCalendar);

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
    if (clientId) {
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadEntries = () => {
    dispatch(fetchContentCalendarEntries({ clientId }));
  };

  // ── Bulk add (draft rows) ────────────────────────────────────────────
  const handleAddRow = () => {
    setDraftRows((prev) => [...prev, blankDraft(clientId)]);
  };

  const handleAddRows = (count) => {
    setDraftRows((prev) => [...prev, ...Array.from({ length: count }, () => blankDraft(clientId))]);
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
    if (entries.length === 0) {
      alert("No entries to export.");
      return;
    }
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const filename = `content-calendar-${clientName.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportContentCalendarToPdf(printRef.current, filename);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">event_note</span>
          Content Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">
              {exporting ? "progress_activity" : "picture_as_pdf"}
            </span>
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            Add Row
          </button>
          <button
            onClick={() => handleAddRows(5)}
            className="px-2 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20"
            title="Add 5 rows at once"
          >
            +5
          </button>
          {draftRows.length > 0 && (
            <button
              onClick={handleSaveAllDrafts}
              disabled={savingAll}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">
                {savingAll ? "progress_activity" : "save"}
              </span>
              Save All ({draftRows.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">
          <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
        </div>
      ) : (
        <ContentCalendarTable
          entries={entries}
          loading={false}
          showClientColumn={false}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onShare={handleShare}
          draftRows={draftRows}
          draftClientName={clientName}
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
          editClientName={clientName}
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
      )}

      {entries.length === 0 && draftRows.length === 0 && !loading && (
        <div className="py-6 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
          <span className="material-symbols-outlined text-[32px] mb-2">event_note</span>
          <p className="font-body-sm text-body-sm">No content calendar entries for {clientName} yet.</p>
        </div>
      )}

      {/* Off-screen printable snapshot used for PDF export */}
      <div style={{ position: "fixed", top: 0, left: "-99999px", zIndex: -1 }}>
        <div ref={printRef}>
          <ContentCalendarPrintView entries={entries} title={clientName} showClientColumn={false} />
        </div>
      </div>
    </div>
  );
}
