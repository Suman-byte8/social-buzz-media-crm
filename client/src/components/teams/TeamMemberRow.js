"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { parseArrayField } from "@/services/teamService";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_META = {
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "gray" },
};

export default function TeamMemberRow({ member, workload, onEdit, onDelete }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const status = (member.status || "").toLowerCase();
  const statusMeta = STATUS_META[status] || { label: "No Status", color: "orange" };

  const assignedWorks = parseArrayField(member.assignedWorks);
  const clientHandling = parseArrayField(member.clientHandling);

  const initials = member.name
    ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  const { openTaskCount, widthPercent } = workload;
  const workloadColor = widthPercent >= 80 ? "bg-primary" : widthPercent >= 40 ? "bg-yellow-500" : "bg-green-500";

  return (
    <tr className="hover:bg-[#F9F9F9] transition-colors group">
      <td className="py-3 px-4">
        <Link href={`/team/${member.id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300 flex items-center justify-center">
            {member.avatar ? (
              <img className="w-full h-full object-cover" src={member.avatar} alt={member.name} />
            ) : (
              <span className="font-title-lg text-on-surface font-bold">{initials}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-title-lg text-title-lg text-on-surface">{member.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[11px] border border-gray-200">
                TM-{member.id}
              </span>
            </div>
            <div className="text-tertiary">{member.designation || member.department || "Team Member"}</div>
          </div>
        </Link>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={statusMeta.label} color={statusMeta.color} showDot />
      </td>
      <td className="py-3 px-4">
        <div className="text-on-surface font-medium truncate max-w-[200px]">
          {assignedWorks.length > 0 ? assignedWorks.slice(0, 2).join(", ") : "No active tasks"}
        </div>
        {assignedWorks.length > 2 && (
          <div className="text-tertiary text-xs">+{assignedWorks.length - 2} more</div>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {clientHandling.slice(0, 3).map((clientName, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-secondary border border-gray-200">
              {clientName}
            </span>
          ))}
          {clientHandling.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-secondary border border-gray-200">
              +{clientHandling.length - 3}
            </span>
          )}
          {clientHandling.length === 0 && <span className="text-tertiary text-xs">None assigned</span>}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${workloadColor}`} style={{ width: `${widthPercent}%` }} />
          </div>
        </div>
        <div className="text-xs text-tertiary">
          {openTaskCount} open {openTaskCount === 1 ? "task" : "tasks"}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-tertiary hover:text-primary transition-colors p-1 rounded hover:bg-gray-100"
            title="Actions"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <Link
                href={`/team/${member.id}`}
                className="flex items-center gap-2 px-3 py-2 text-label-sm text-label-md text-on-surface hover:bg-gray-100 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                View Profile
              </Link>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onEdit(member);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-label-md text-on-surface hover:bg-gray-100 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onDelete(member);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-label-md text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
