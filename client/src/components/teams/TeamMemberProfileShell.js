"use client";

import React from "react";
import { parseArrayField } from "@/services/teamService";

export default function TeamMemberProfileShell({ member }) {
  const assignedWorks = parseArrayField(member.assignedWorks);
  const clientHandling = parseArrayField(member.clientHandling);

  const initials = member.name
    ? member.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const status = (member.status || "").toLowerCase();
  const getStatusBadge = () => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-green-50 text-green-700 font-label-sm text-label-sm border border-green-100">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
        </span>
      );
    }
    if (status === "inactive") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 font-label-sm text-label-sm border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 font-label-sm text-label-sm border border-orange-100">
        <span className="material-symbols-outlined text-[12px]">warning</span> No Status
      </span>
    );
  };

  const hireDate = member.hireDate
    ? new Date(member.hireDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const Tenure =
    member.hireDate && !isNaN(new Date(member.hireDate))
      ? Math.floor(
          (new Date().getTime() - new Date(member.hireDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
      : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Profile Header Card (Hero) */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-32 w-full bg-gradient-to-r from-surface-variant to-surface-container-highest relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#926f6b 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              {/* Avatar & Title */}
              <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-12 relative z-10">
                <div className="w-32 h-32 rounded-xl border-4 border-surface bg-surface-container-high overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                  {member.avatar ? (
                    <img
                      className="w-full h-full object-cover"
                      src={member.avatar}
                      alt={member.name}
                    />
                  ) : (
                    <span className="font-display-lg text-display-lg text-primary font-bold">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-3">
                    <h1 className="font-display-lg text-display-lg text-on-surface mb-1">
                      {member.name}
                    </h1>
                    {getStatusBadge()}
                  </div>
                  <p className="font-title-lg text-title-lg text-on-surface-variant mb-3">
                    {member.designation || member.department || "Team Member"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        location_on
                      </span>
                      <span>{member.address || "Location not set"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        schedule
                      </span>
                      <span>
                        {member.employmentType
                          ? member.employmentType.charAt(0).toUpperCase() +
                            member.employmentType.slice(1)
                          : "Full-Time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        work_history
                      </span>
                      <span>{Tenure} months tenure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pb-2">
                <button className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    mail
                  </span>
                  {member.email || "Message"}
                </button>
                <button className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">
                    edit
                  </span>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">
              Contact Information
            </h2>
            <ul className="space-y-6">
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  mail
                </span>
                <a
                  className="font-body-md text-body-md hover:text-primary transition-colors hover:underline"
                  href={member.email ? `mailto:${member.email}` : "#"}
                >
                  {member.email || "No email on file"}
                </a>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  call
                </span>
                <span className="font-body-md text-body-md">
                  {member.number || member.phoneNumber || "No phone on file"}
                </span>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-primary"
                >
                  <path d="M12.04 4.5C7.34 4.5 3.54 7.83 3.54 12.5c0 2.06 1 3.94 2.62 5.14-.13-.47-.21-.95-.21-1.44 0-.28.03-.57.07-.85.06-.43.14-.86.24-1.27-.91-.27-1.64-.71-2.21-1.32-.08.59-.13 1.2-.13 1.81 0 4.18 3.42 7.6 7.59 7.6h.05c.49 0 .99-.04 1.47-.11.04-.49.07-.98.07-1.47s-.02-.98-.07-1.47c.61.06 1.18.11 1.75.11.56 0 1.13-.06 1.69-.16.01-.32.02-.65.02-.98 0-3.91-.97-7.54-2.57-10.64-.12-.23-.26-.46-.39-.69.28.26.55.56.78.87 2.14-1.29 4.74-2.08 7.57-2.08 4.71 0 8.51 3.59 8.51 8s-3.81 8-8.51 8c-1.51 0-2.91-.37-4.15-.99-.14-.06.29-.49.21-.62-.2-.27-.49-.41-.77-.53-1.84-.95-3.12-2.82-3.12-5.01 0-2.63 1.64-4.85 3.93-5.82.29-.12.61-.23.93-.31.02.22.03.45.03.68zm-3.72 5.69c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm4.98 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
                </svg>
                <span className="font-body-md text-body-md">
                  {member.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${member.whatsappNumber.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {member.whatsappNumber}
                    </a>
                  ) : (
                    "No WhatsApp on file"
                  )}
                </span>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  location_on
                </span>
                <span className="font-body-md text-body-md">
                  {member.address || "No address on file"}
                </span>
              </li>
            </ul>
          </div>

          {/* Internal Details Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">
              Internal Details
            </h2>
            <div className="space-y-6">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Department
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  {member.department || "Not assigned"}
                </p>
              </div>

              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Reports To
                </p>
                {member.managerReportTo ? (
                  <span className="font-body-md text-body-md text-on-surface">
                    {member.managerReportTo}
                  </span>
                ) : (
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    No manager assigned
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Hire Date
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {hireDate}
                  </p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Emp. Type
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {member.employmentType
                      ? member.employmentType.charAt(0).toUpperCase() +
                        member.employmentType.slice(1)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Tasks Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">
            Assigned Works
          </h2>
          {assignedWorks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Work Item
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Client
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Status
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {assignedWorks.map((work, idx) => (
                    <tr
                      key={idx}
                      className="group hover:bg-surface-container-low transition-colors"
                    >
                      <td className="py-4 font-body-md text-body-md text-on-surface">
                        {typeof work === "string" ? work : work.name || work.title}
                      </td>
                      <td className="py-4 font-body-md text-body-md text-on-surface-variant">
                        {typeof work === "object" && work.client
                          ? work.client
                          : clientHandling[idx] || "N/A"}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded-full bg-primary-container text-on-primary-container text-label-sm font-medium">
                          {typeof work === "object" && work.status
                            ? work.status
                            : "In Progress"}
                        </span>
                      </td>
                      <td className="py-4 font-body-md text-body-md text-on-surface-variant">
                        {typeof work === "object" && work.dueDate
                          ? work.dueDate
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-on-surface-variant rounded-lg border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-3xl mb-2">assignment</span>
              <p>No works currently assigned to {member.name}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
