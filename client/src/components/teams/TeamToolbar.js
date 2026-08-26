"use client";

import React from "react";

const CSV_COLUMNS = ["id", "name", "email", "designation", "department", "status", "employmentType", "hireDate"];

const exportTeamMembersToCsv = (teamMembers) => {
  const header = CSV_COLUMNS.join(",");
  const rows = teamMembers.map((member) =>
    CSV_COLUMNS.map((col) => `"${String(member[col] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `team-members-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function TeamToolbar({ teamMembers, onAddMember }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface">Team</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Manage agency personnel, workloads, and assignments.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => exportTeamMembersToCsv(teamMembers)}
          className="h-10 px-4 rounded bg-white border border-outline-variant text-on-surface font-label-md text-label-md flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-card"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export
        </button>
        <button
          onClick={onAddMember}
          className="h-10 px-4 rounded bg-primary text-white font-label-md text-label-md flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-card"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Team Member
        </button>
      </div>
    </div>
  );
}
