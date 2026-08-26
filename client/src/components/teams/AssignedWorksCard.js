"use client";

import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

const TASK_STATUS_META = {
  completed: { label: "Completed", color: "green" },
  in_progress: { label: "In Progress", color: "blue" },
  todo: { label: "To Do", color: "amber" },
};

const formatDueDate = (dateVal) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AssignedWorksCard({
  memberId,
  memberName,
  displayWorksList,
  loadingTasks,
  clientHandlingNames,
  deletingTaskId,
  onAssignWork,
  onEditTask,
  onDeleteTask,
}) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Assigned Works</h2>
          <p className="text-body-sm text-on-surface-variant">Tasks &amp; work items assigned to {memberName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/tasks?assigneeId=${memberId}`}
            className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            View Tasks Board
          </Link>
          <button
            onClick={onAssignWork}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-label-md text-label-md hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-card"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            Assign New Work
          </button>
        </div>
      </div>

      {loadingTasks ? (
        <div className="p-6 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
        </div>
      ) : displayWorksList.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Work Item</th>
                <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Client</th>
                <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Due Date</th>
                <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {displayWorksList.map((work, idx) => {
                const statusKey = (work.status || "in_progress").toLowerCase();
                const statusMeta = TASK_STATUS_META[statusKey] || { label: statusKey.replace(/_/g, " "), color: "gray" };
                return (
                  <tr key={work.id ? `task-db-${work.id}` : `work-legacy-${idx}-${work.title}`} className="group hover:bg-surface-container-low transition-colors">
                    <td className="py-4 font-body-md text-body-md text-on-surface font-medium">
                      <Link
                        href={`/tasks?search=${encodeURIComponent(work.title)}&assigneeId=${memberId}`}
                        className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-semibold"
                        title="Click to view on Tasks Board"
                      >
                        {work.title}
                        <span className="material-symbols-outlined text-[15px] opacity-0 group-hover:opacity-100 transition-opacity text-primary">open_in_new</span>
                      </Link>
                    </td>
                    <td className="py-4 font-body-md text-body-md text-on-surface-variant">
                      {work.clientName || clientHandlingNames[idx] || "N/A"}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={statusMeta.label} color={statusMeta.color} showDot />
                    </td>
                    <td className="py-4 font-body-md text-body-md text-on-surface-variant font-mono text-sm">{formatDueDate(work.dueDate)}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/tasks?search=${encodeURIComponent(work.title)}&assigneeId=${memberId}`}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-gray-100 transition-colors"
                          title="View on Tasks Board"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </Link>
                        <button
                          onClick={() => onEditTask(work)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-gray-100 transition-colors"
                          title="Edit Work Item"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteTask(work)}
                          disabled={deletingTaskId === (work.id || work.title)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete Work Item"
                        >
                          {deletingTaskId === (work.id || work.title) ? (
                            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-on-surface-variant rounded-lg border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-3xl mb-2">assignment</span>
          <p>No works currently assigned to {memberName}.</p>
        </div>
      )}
    </div>
  );
}
