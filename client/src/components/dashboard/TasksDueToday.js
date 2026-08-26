"use client";

import React from "react";
import Link from "next/link";

const formatDueTime = (dueDate) => {
  if (!dueDate) return "No due date";
  const date = new Date(dueDate);
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function TasksDueToday({ heading = "Tasks Due Today", tasks = [], remainingCount = 0, onToggleComplete, loading }) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F0F0F0]">
        <h2 className="font-title-lg text-title-lg text-on-surface">
          {heading}
        </h2>
        <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2 py-1 rounded-full">
          {remainingCount} Open
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant py-6 text-center flex-1">Nothing on the board — you&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-3 flex-1 overflow-y-auto">
          {tasks.map((task) => {
            const assigneeNames = task.assigneeDetails && task.assigneeDetails.length > 0
              ? task.assigneeDetails.map((a) => a.name).join(", ")
              : "Unassigned";
            return (
              <li key={task.id} className="flex items-start group">
                <input
                  className="mt-1 mr-3 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => onToggleComplete(task)}
                />
                <div>
                  <p className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                    {task.title}
                    {task.clientName && <span className="text-on-surface-variant font-normal"> · {task.clientName}</span>}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Assigned to {assigneeNames} • Due {formatDueTime(task.dueDate)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/tasks"
        className="mt-4 w-full py-2 bg-transparent text-primary border border-primary/20 rounded-md font-label-md text-label-md hover:bg-primary/5 transition-colors text-center block"
      >
        View All Tasks
      </Link>
    </div>
  );
}
