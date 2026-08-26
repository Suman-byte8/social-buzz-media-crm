"use client";

import React from "react";
import TaskCard from "./TaskCard";

const COLUMNS = [
  { id: "todo", title: "Backlog", icon: "inbox" },
  { id: "in_progress", title: "In Progress", icon: "autorenew" },
  { id: "review", title: "Review", icon: "rate_review" },
  { id: "completed", title: "Completed", icon: "task_alt" },
];

export default function TasksBoard({ tasksByColumn, loading, hasAnyTasks, onStatusChange, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="py-16 text-center text-on-surface-variant">
        <span className="animate-spin material-symbols-outlined text-[28px]">progress_activity</span>
      </div>
    );
  }

  if (!hasAnyTasks) {
    return (
      <div className="py-16 text-center text-on-surface-variant bg-white border border-outline-variant rounded-lg shadow-card">
        <span className="material-symbols-outlined text-[40px] block mb-1.5">task_alt</span>
        No tasks match the current filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {COLUMNS.map((column) => {
        const columnTasks = tasksByColumn[column.id] || [];
        return (
          <div key={column.id} className="bg-gray-50 rounded-lg p-3 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="flex items-center gap-1.5 font-semibold text-xs text-gray-700 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-gray-400">{column.icon}</span>
                {column.title}
              </h3>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No tasks here.</p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
