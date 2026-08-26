"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";

const PRIORITY_COLOR = { urgent: "red", high: "orange", medium: "blue", low: "gray" };
const PRIORITY_LABEL = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
const PRIORITY_BORDER = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-gray-300",
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === 0) return { text: "Today", overdue: false };
  if (diffDays === 1) return { text: "Tomorrow", overdue: false };
  if (diffDays <= 7) return { text: `${diffDays}d`, overdue: false };
  return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), overdue: false };
};

export default function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const taskAssignees = task.assigneeDetails || [];
  const due = formatDate(task.dueDate);
  const borderClass = PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.medium;

  return (
    <div className={`bg-white rounded-lg border border-l-4 ${borderClass} border-outline-variant p-3 shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <StatusBadge status={PRIORITY_LABEL[task.priority] || task.priority} color={PRIORITY_COLOR[task.priority] || "blue"} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "todo" && (
            <button
              onClick={() => onStatusChange(task, "todo")}
              className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Move to Backlog"
            >
              <span className="material-symbols-outlined text-[12px]">arrow_back</span>
            </button>
          )}
          {task.status !== "in_progress" && task.status !== "completed" && (
            <button
              onClick={() => onStatusChange(task, "in_progress")}
              className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Move to In Progress"
            >
              <span className="material-symbols-outlined text-[12px]">play_arrow</span>
            </button>
          )}
          {task.status === "in_progress" && (
            <button
              onClick={() => onStatusChange(task, "review")}
              className="p-0.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
              title="Move to Review"
            >
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </button>
          )}
          {task.status === "review" && (
            <>
              <button
                onClick={() => onStatusChange(task, "in_progress")}
                className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Move back to In Progress"
              >
                <span className="material-symbols-outlined text-[12px]">arrow_back</span>
              </button>
              <button
                onClick={() => onStatusChange(task, "completed")}
                className="p-0.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                title="Mark as Completed"
              >
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
              </button>
            </>
          )}
          {task.status === "completed" && (
            <button
              onClick={() => onStatusChange(task, "review")}
              className="p-0.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
              title="Move back to Review"
            >
              <span className="material-symbols-outlined text-[12px]">arrow_back</span>
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-600 hover:text-primary rounded hover:bg-gray-100"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1 text-gray-600 hover:text-red-600 rounded hover:bg-red-50"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>

      <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{task.title}</h4>

      {task.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {task.clientName && <span className="px-1.5 py-0.5 bg-gray-100 rounded">{task.clientName}</span>}
          {due && (
            <span className={`flex items-center gap-0.5 ${due.overdue ? "text-red-600 font-medium" : ""}`}>
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              {due.text}
            </span>
          )}
        </div>
        {taskAssignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {taskAssignees.slice(0, 3).map((assignee) => {
              const initials = assignee.name
                ? assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                : "?";
              return (
                <div
                  key={assignee.id}
                  className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold border-2 border-white"
                  title={assignee.name}
                >
                  {initials}
                </div>
              );
            })}
            {taskAssignees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] border-2 border-white">
                +{taskAssignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
