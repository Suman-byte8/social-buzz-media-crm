"use client";

import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { getAssetUrl } from "@/services/apiClient";

const MEMBER_STATUS_META = {
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "gray" },
};

export default function TeamMemberProfileHeader({ member, tenureMonths, onAssignWork, onAssignClient, onEditProfile }) {
  const initials = member.name
    ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  const status = (member.status || "").toLowerCase();
  const statusMeta = MEMBER_STATUS_META[status] || { label: "No Status", color: "orange" };

  const hireDate = member.hireDate
    ? new Date(member.hireDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  return (
    <div>
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-4"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Team
      </Link>

      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-card">
        {/* Banner */}
        <div className="h-20 w-full bg-gradient-to-r from-surface-variant to-surface-container-highest relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(#926f6b 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          />
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Avatar & Title */}
            <div className="flex flex-col md:flex-row gap-5 -mt-10 relative z-10">
              <div className="w-24 h-24 rounded-xl border-4 border-surface bg-surface-container-high overflow-hidden shadow-card shrink-0 flex items-center justify-center bg-gray-100">
                {member.avatar ? (
                  <img className="w-full h-full object-cover" src={getAssetUrl(member.avatar)} alt={member.name} />
                ) : (
                  <span className="font-headline-md text-headline-md text-primary font-bold">{initials}</span>
                )}
              </div>
              <div className="pb-1 pt-2 md:pt-8">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-headline-md text-headline-md text-on-surface">{member.name}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-mono text-[11px] font-semibold border border-outline-variant">
                    TM-{member.id}
                  </span>
                  <StatusBadge status={statusMeta.label} color={statusMeta.color} showDot />
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 mb-2.5">
                  {member.designation || member.department || "Team Member"}
                </p>
                <div className="flex flex-wrap items-center text-on-surface-variant font-body-sm text-body-sm">
                  <div className="flex items-center gap-1.5 pr-3">
                    <span className="material-symbols-outlined text-[15px]">location_on</span>
                    <span>{member.address || "Location not set"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 border-l border-outline-variant">
                    <span className="material-symbols-outlined text-[15px]">schedule</span>
                    <span>
                      {member.employmentType
                        ? member.employmentType.charAt(0).toUpperCase() + member.employmentType.slice(1)
                        : "Full-Time"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 border-l border-outline-variant">
                    <span className="material-symbols-outlined text-[15px]">work_history</span>
                    <span>{tenureMonths} mo. tenure</span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-3 border-l border-outline-variant">
                    <span className="material-symbols-outlined text-[15px]">event</span>
                    <span>Joined {hireDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <button
                onClick={onEditProfile}
                className="px-3.5 py-2 rounded-lg bg-white border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Profile
              </button>
              <button
                onClick={onAssignClient}
                className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-label-md text-label-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-card"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Assign Client
              </button>
              <button
                onClick={onAssignWork}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-label-md text-label-md hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-card"
              >
                <span className="material-symbols-outlined text-[16px]">add_task</span>
                Assign Work
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
