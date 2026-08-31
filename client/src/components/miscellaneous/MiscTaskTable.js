"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { TYPE_OF_WORK_OPTIONS } from "./constants";
import MiscTaskRowEditor from "./MiscTaskRowEditor";

const STATUS_META = {
  pending: { label: "Pending", color: "gray" },
  progress: { label: "In Progress", color: "amber" },
  delivered: { label: "Delivered", color: "green" },
};

const TYPE_LABELS = TYPE_OF_WORK_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {});

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function MiscTaskTable({
  tasks,
  loading,
  clients,
  teamMembers,
  getClientName,
  getAssigneeName,
  onEdit,
  onDelete,

  // Draft (new, unsaved) rows rendered inline at the top of the table.
  draftRows = [],
  onDraftChange,
  onDraftStageFile,
  onDraftRemoveStagedFile,
  onSaveDraft,
  onDiscardDraft,
  savingDraftId,
  draftErrors = {},

  // Inline editing of an existing, already-saved task.
  editingId,
  editValues,
  editStagedFile,
  onEditChange,
  onEditStageFile,
  onEditRemoveStagedFile,
  onSaveEdit,
  onCancelEdit,
  savingEdit,
  editError,
}) {
  const hasDrafts = draftRows.length > 0;

  return (
    <div className="bg-white rounded-b-xl border border-outline-variant shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[960px] text-left border-collapse">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Client</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Type of Work</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Assigned Date</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Delivery Date</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Assigned To</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">File</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-body-sm font-body-sm">
          {draftRows.map((draft) => (
            <MiscTaskRowEditor
              key={draft.tempId}
              clients={clients}
              teamMembers={teamMembers}
              values={draft}
              stagedFile={draft.stagedFile}
              onChange={(field, value) => onDraftChange(draft.tempId, field, value)}
              onStageFile={(file) => onDraftStageFile(draft.tempId, file)}
              onRemoveStagedFile={() => onDraftRemoveStagedFile(draft.tempId)}
              onSave={() => onSaveDraft(draft.tempId)}
              onCancel={() => onDiscardDraft(draft.tempId)}
              saving={savingDraftId === draft.tempId}
              error={draftErrors[draft.tempId]}
              saveLabel="Create task"
            />
          ))}

          {loading ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-secondary">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading tasks...
              </td>
            </tr>
          ) : tasks.length === 0 && !hasDrafts ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">widgets</span>
                No miscellaneous tasks found.
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              if (editingId === task.id) {
                return (
                  <MiscTaskRowEditor
                    key={task.id}
                    clients={clients}
                    teamMembers={teamMembers}
                    values={editValues}
                    existingFile={task.fileId ? { fileName: task.fileName } : null}
                    stagedFile={editStagedFile}
                    onChange={onEditChange}
                    onStageFile={onEditStageFile}
                    onRemoveStagedFile={onEditRemoveStagedFile}
                    onSave={onSaveEdit}
                    onCancel={onCancelEdit}
                    saving={savingEdit}
                    error={editError}
                    saveLabel="Save changes"
                  />
                );
              }

              const meta = STATUS_META[task.status] || { label: task.status || "Unknown", color: "gray" };
              return (
                <tr key={task.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                  <td className="py-4 px-4 text-on-surface font-medium">{getClientName(task.clientId)}</td>
                  <td className="py-4 px-4 text-secondary">{TYPE_LABELS[task.typeOfWork] || task.typeOfWork}</td>
                  <td className="py-4 px-4 text-secondary whitespace-nowrap">{formatDate(task.assignedDate)}</td>
                  <td className="py-4 px-4 text-secondary whitespace-nowrap">{formatDate(task.deliveryDate)}</td>
                  <td className="py-4 px-4 text-secondary">{getAssigneeName(task.assignedTo)}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={meta.label} color={meta.color} showDot />
                  </td>
                  <td className="py-4 px-4">
                    {task.fileId ? (
                      <a
                        href={task.webViewLink || task.googleUserContentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline max-w-[140px]"
                        title={task.fileName}
                      >
                        <span className="material-symbols-outlined text-[16px] shrink-0">description</span>
                        <span className="truncate">{task.fileName}</span>
                      </a>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors"
                        title="Edit Task"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Task"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
