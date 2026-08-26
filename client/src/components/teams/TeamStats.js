"use client";

import React from "react";

export default function TeamStats({ stats }) {
  const statCards = [
    { id: 1, title: "Total Members", value: stats.totalMembers, icon: "group", iconColor: "text-on-surface-variant" },
    { id: 2, title: "Active Now", value: stats.activeNow, icon: "check_circle", iconColor: "text-green-600" },
    { id: 3, title: "Open Tasks (Team)", value: stats.openTasks, icon: "checklist", iconColor: "text-blue-600" },
    { id: 4, title: "Completed This Week", value: stats.completedThisWeek, icon: "task_alt", iconColor: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat) => (
        <div key={stat.id} className="bg-white rounded-lg border border-outline-variant p-5 shadow-card">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className={`material-symbols-outlined text-[18px] ${stat.iconColor}`}>{stat.icon}</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">{stat.title}</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
