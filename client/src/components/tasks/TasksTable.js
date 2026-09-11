"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";

const COLUMNS = [
  { key: "title", label: "Task" },
  { key: "clientName", label: "Client" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
  { key: "dueDate", label: "Due Date" },
  { key: "assignedBy", label: "Assigned By" },
  { key: "assignees", label: "Assigned To" },
  { key: "actions", label: "Actions" },
];

const PRIORITY_COLOR = { urgent: "red", high: "orange", medium: "blue", low: "gray" };
const PRIORITY_LABEL = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };

const STATUS_LABEL = { todo: "Backlog", in_progress: "In Progress", review: "Review", completed: "Completed" };
const STATUS_SELECT_CLASS = {
  todo: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-100",
  review: "bg-purple-50 text-purple-700 border-purple-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const formatDueDate = (dateStr, status) => {
  if (!dateStr) return { text: "—", overdue: false };
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  // A completed task is never "overdue" — it's done, regardless of when
  // its due date was relative to today.
  if (diffDays < 0 && status !== "completed") return { text: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === 0) return { text: "Today", overdue: false };
  if (diffDays === 1) return { text: "Tomorrow", overdue: false };
  return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), overdue: false };
};

const initialsFor = (name) => (name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?");

export default function TasksTable({ tasks, loading, hasAnyTasks, sortBy, sortOrder, onSort, onStatusChange, onEdit, onDelete, onView }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left border-collapse">
        <thead className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
          <tr>
            {COLUMNS.map((col) => {
              const sortable = col.key !== "actions" && col.key !== "assignees" && col.key !== "assignedBy";
              return (
                <th
                  key={col.key}
                  onClick={() => sortable && onSort(col.key)}
                  className={`py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider select-none ${
                    sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  } ${col.key === "actions" ? "text-right" : ""}`}
                >
                  <div className={`flex items-center gap-1 ${col.key === "actions" ? "justify-end" : ""}`}>
                    {col.label}
                    {sortBy === col.key && (
                      <span className="material-symbols-outlined text-[16px]">
                        {sortOrder === "ASC" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="text-body-sm font-body-sm">
          {loading ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-12 text-center text-secondary">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading tasks...
              </td>
            </tr>
          ) : !hasAnyTasks ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">task_alt</span>
                No tasks match the current filters.
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const assignees = task.assigneeDetails || [];
              const due = formatDueDate(task.dueDate, task.status);
              return (
                <tr
                  key={task.id}
                  onClick={() => onView?.(task)}
                  className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-4 max-w-[280px]">
                    <p className="font-medium text-on-surface truncate">{task.title}</p>
                    {task.description && <p className="text-secondary text-xs truncate mt-0.5">{task.description}</p>}
                  </td>
                  <td className="py-3 px-4 text-secondary">{task.clientName || "Internal"}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={PRIORITY_LABEL[task.priority] || task.priority} color={PRIORITY_COLOR[task.priority] || "blue"} />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onStatusChange(task, e.target.value)}
                      className={`text-xs font-medium rounded-full pl-2.5 pr-6 py-1 border outline-none cursor-pointer appearance-none ${
                        STATUS_SELECT_CLASS[task.status] || STATUS_SELECT_CLASS.todo
                      }`}
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={due.overdue ? "text-red-600 font-medium" : "text-secondary"}>{due.text}</span>
                  </td>
                  <td className="py-3 px-4 text-secondary whitespace-nowrap">
                    {task.assignedByMember?.name || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {assignees.length > 0 ? (
                      <div className="flex -space-x-1.5">
                        {assignees.slice(0, 3).map((assignee) => (
                          <div
                            key={assignee.id}
                            className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold border-2 border-white"
                            title={assignee.name}
                          >
                            {initialsFor(assignee.name)}
                          </div>
                        ))}
                        {assignees.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] border-2 border-white">
                            +{assignees.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-secondary">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors"
                        title="Edit Task"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(task)}
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
