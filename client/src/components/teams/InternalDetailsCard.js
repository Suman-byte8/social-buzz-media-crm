"use client";

import React from "react";

export default function InternalDetailsCard({ member, hireDate }) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-card">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-5">Internal Details</h2>
      <div className="space-y-5">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Department</p>
          <p className="font-body-md text-body-md text-on-surface font-medium flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
            {member.department || "Not assigned"}
          </p>
        </div>

        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Reports To</p>
          {member.managerReportTo ? (
            <span className="font-body-md text-body-md text-on-surface">{member.managerReportTo}</span>
          ) : (
            <span className="font-body-md text-body-md text-on-surface-variant">No manager assigned</span>
          )}
        </div>

        <div className="pt-1 border-t border-outline-variant/40 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Hire Date</p>
            <p className="font-body-md text-body-md text-on-surface text-right">{hireDate}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Emp. Type</p>
            <p className="font-body-md text-body-md text-on-surface text-right">
              {member.employmentType
                ? member.employmentType.charAt(0).toUpperCase() + member.employmentType.slice(1)
                : "Not specified"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
