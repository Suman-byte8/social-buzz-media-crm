"use client";

import React from "react";

const STAT_CHIPS = [
  { key: "totalTasks", label: "Total" },
  { key: "todo", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

export default function TasksToolbar({ stats, onNewTask }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Task Management</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Track and manage agency deliverables.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-white border border-outline-variant rounded-lg shadow-card px-3 py-1.5">
          {STAT_CHIPS.map((chip, i) => (
            <div key={chip.key} className={`flex items-center gap-1.5 px-2 ${i > 0 ? "border-l border-outline-variant" : ""}`}>
              <span className="font-title-lg text-title-lg text-on-surface leading-none">{stats?.[chip.key] ?? 0}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{chip.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onNewTask}
          className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-card flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Task
        </button>
      </div>
    </div>
  );
}
