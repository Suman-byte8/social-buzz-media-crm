"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MiscTaskToolbar from "@/components/miscellaneous/MiscTaskToolbar";
import MiscTaskFilters from "@/components/miscellaneous/MiscTaskFilters";
import MiscTaskTable from "@/components/miscellaneous/MiscTaskTable";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import { fetchMiscTasks, saveMiscTask, updateMiscTask, deleteMiscTask } from "@/redux/slices/miscTasksSlice";

let draftIdCounter = 0;
const nextDraftId = () => `draft-${Date.now()}-${draftIdCounter++}`;

const blankDraft = () => ({
  tempId: nextDraftId(),
  clientId: "",
  typeOfWork: "banner",
  assignedDate: new Date().toISOString().split("T")[0],
  deliveryDate: "",
  status: "pending",
  assignedTo: "",
  stagedFile: null,
});

export default function MiscellaneousPage() {
  const dispatch = useDispatch();
  const { clients, loading: loadingClients } = useSelector((state) => state.clients);
  const { teamMembers } = useSelector((state) => state.team);
  const { miscTasks, loading } = useSelector((state) => state.miscTasks);

  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [draftRows, setDraftRows] = useState([]);
  const [savingDraftId, setSavingDraftId] = useState(null);
  const [draftErrors, setDraftErrors] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [editStagedFile, setEditStagedFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    if (teamMembers.length === 0) {
      dispatch(fetchTeamMembers());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const loadTasks = () => {
    dispatch(fetchMiscTasks({
      ...(clientFilter ? { clientId: clientFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(typeFilter ? { typeOfWork: typeFilter } : {}),
    }));
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, clientFilter, statusFilter, typeFilter]);

  // ── Bulk add (draft rows) ────────────────────────────────────────────
  const handleAddRow = () => {
    setDraftRows((prev) => [...prev, blankDraft()]);
  };

  const handleAddRows = (count) => {
    setDraftRows((prev) => [...prev, ...Array.from({ length: count }, blankDraft)]);
  };

  const handleDraftChange = (tempId, field, value) => {
    setDraftRows((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d)));
  };

  const handleDraftStageFile = (tempId, file) => {
    setDraftRows((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, stagedFile: file } : d)));
  };

  const handleDraftRemoveStagedFile = (tempId) => {
    setDraftRows((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, stagedFile: null } : d)));
  };

  const handleDiscardDraft = (tempId) => {
    setDraftRows((prev) => prev.filter((d) => d.tempId !== tempId));
    setDraftErrors((prev) => {
      const next = { ...prev };
      delete next[tempId];
      return next;
    });
  };

  const buildFormData = (draft) => {
    const fd = new FormData();
    fd.append("clientId", draft.clientId);
    fd.append("typeOfWork", draft.typeOfWork);
    fd.append("assignedDate", draft.assignedDate || "");
    fd.append("deliveryDate", draft.deliveryDate || "");
    fd.append("status", draft.status);
    fd.append("assignedTo", draft.assignedTo || "");
    if (draft.stagedFile) fd.append("file", draft.stagedFile);
    return fd;
  };

  const handleSaveDraft = async (tempId) => {
    const draft = draftRows.find((d) => d.tempId === tempId);
    if (!draft) return;

    if (!draft.clientId) {
      setDraftErrors((prev) => ({ ...prev, [tempId]: "Please select a client." }));
      return;
    }

    setSavingDraftId(tempId);
    setDraftErrors((prev) => ({ ...prev, [tempId]: undefined }));
    try {
      await dispatch(saveMiscTask(buildFormData(draft))).unwrap();
      setDraftRows((prev) => prev.filter((d) => d.tempId !== tempId));
      loadTasks();
    } catch (error) {
      setDraftErrors((prev) => ({ ...prev, [tempId]: (typeof error === "string" ? error : error?.message) || "Failed to save." }));
    } finally {
      setSavingDraftId(null);
    }
  };

  // ── Inline edit of an existing task ─────────────────────────────────
  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditValues({
      clientId: task.clientId,
      typeOfWork: task.typeOfWork,
      assignedDate: task.assignedDate || "",
      deliveryDate: task.deliveryDate || "",
      status: task.status,
      assignedTo: task.assignedTo || "",
    });
    setEditStagedFile(null);
    setEditRemoveExisting(false);
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
    setEditStagedFile(null);
    setEditError("");
  };

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editValues.clientId) {
      setEditError("Please select a client.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      if (editStagedFile) {
        const fd = new FormData();
        fd.append("id", editingId);
        fd.append("file", editStagedFile);
        fd.append("clientId", editValues.clientId);
        fd.append("typeOfWork", editValues.typeOfWork);
        fd.append("assignedDate", editValues.assignedDate || "");
        fd.append("deliveryDate", editValues.deliveryDate || "");
        fd.append("status", editValues.status);
        fd.append("assignedTo", editValues.assignedTo || "");
        await dispatch(saveMiscTask(fd)).unwrap();
      } else {
        await dispatch(updateMiscTask({ id: editingId, updateData: editValues })).unwrap();
      }
      handleCancelEdit();
      loadTasks();
    } catch (error) {
      setEditError((typeof error === "string" ? error : error?.message) || "Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await dispatch(deleteMiscTask(id)).unwrap();
    } catch (err) {
      // Failure is surfaced via state.miscTasks.error
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const getAssigneeName = (assignedTo) => {
    if (!assignedTo) return "Unassigned";
    const member = teamMembers.find((m) => m.id === assignedTo);
    return member ? member.name : "Unknown";
  };

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <MiscTaskToolbar onAddRow={handleAddRow} onAddRows={handleAddRows} />

      <MiscTaskFilters
        clientFilter={clientFilter}
        onClientChange={setClientFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        clients={clients}
      />

      <MiscTaskTable
        tasks={miscTasks}
        loading={loadingClients || loading}
        clients={clients}
        teamMembers={teamMembers}
        getClientName={getClientName}
        getAssigneeName={getAssigneeName}
        onEdit={handleStartEdit}
        onDelete={handleDelete}
        draftRows={draftRows}
        onDraftChange={handleDraftChange}
        onDraftStageFile={handleDraftStageFile}
        onDraftRemoveStagedFile={handleDraftRemoveStagedFile}
        onSaveDraft={handleSaveDraft}
        onDiscardDraft={handleDiscardDraft}
        savingDraftId={savingDraftId}
        draftErrors={draftErrors}
        editingId={editingId}
        editValues={editValues}
        editStagedFile={editStagedFile}
        onEditChange={handleEditChange}
        onEditStageFile={setEditStagedFile}
        onEditRemoveStagedFile={() => setEditStagedFile(null)}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        savingEdit={savingEdit}
        editError={editError}
      />
    </main>
  );
}
