"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getAssetUrl } from "@/services/apiClient";

const PRIORITY_META = {
  urgent: { label: "Urgent", color: "red" },
  high: { label: "High", color: "orange" },
  medium: { label: "Medium", color: "blue" },
  low: { label: "Low", color: "gray" },
};

const STATUS_META = {
  todo: { label: "Backlog", color: "gray" },
  in_progress: { label: "In Progress", color: "blue" },
  review: { label: "Review", color: "purple" },
  completed: { label: "Completed", color: "green" },
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

export default function TaskViewModal({ task, onClose, onEdit, onDelete }) {
  if (!task) return null;

  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const statusMeta = STATUS_META[task.status] || STATUS_META.todo;
  const assignees = task.assigneeDetails || [];
  const dueLabel = formatFullDate(task.dueDate);
  const createdLabel = formatFullDate(task.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={statusMeta.label} color={statusMeta.color} showDot />
            <StatusBadge status={priorityMeta.label} color={priorityMeta.color} />
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded shrink-0"
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 whitespace-pre-wrap break-words">{task.title}</h2>
          </div>

          {task.description && (
            <div>
              <p className="font-label-sm text-label-sm text-gray-500 mb-1">Description</p>
              <p className="text-body-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="font-label-sm text-label-sm text-gray-500 mb-1">Client</p>
              <p className="text-body-sm text-gray-800">{task.clientName || "No specific client (Internal Task)"}</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-gray-500 mb-1">Due Date</p>
              <p className="text-body-sm text-gray-800">{dueLabel || "No due date"}</p>
            </div>
            {createdLabel && (
              <div>
                <p className="font-label-sm text-label-sm text-gray-500 mb-1">Created</p>
                <p className="text-body-sm text-gray-800">{createdLabel}</p>
              </div>
            )}
            <div>
              <p className="font-label-sm text-label-sm text-gray-500 mb-1">Assigned By</p>
              <p className="text-body-sm text-gray-800">{task.assignedByMember?.name || "Not specified"}</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-gray-500 mb-1.5">Assigned To</p>
              {assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignees.map((assignee) => {
                    const initials = assignee.name
                      ? assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                      : "?";
                    return (
                      <span
                        key={assignee.id}
                        className="inline-flex items-center gap-2 pl-1 pr-3 py-1.5 bg-primary-container/40 rounded-full text-label-sm font-label-sm text-on-surface"
                      >
                        <span className="w-7 h-7 rounded-full bg-primary-container text-primary flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0">
                          {assignee.avatar ? (
                            <img src={getAssetUrl(assignee.avatar)} alt={assignee.name} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                        {assignee.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-body-sm text-gray-500">Unassigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 mr-auto"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
