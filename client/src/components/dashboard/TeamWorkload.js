"use client";

import React from "react";
import Link from "next/link";

const barColorFor = (widthPercent) => {
  if (widthPercent >= 80) return "bg-red-600";
  if (widthPercent >= 40) return "bg-primary";
  return "bg-primary/50";
};

export default function TeamWorkload({ members = [], loading }) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-title-lg text-title-lg text-on-surface">
          Team Workload
        </h2>
        <Link href="/team" className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant py-6 text-center">No team members found.</p>
      ) : (
        <div className="space-y-4">
          {members.map((member) => {
            const initials = member.name
              ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : "?";
            return (
              <div key={member.id} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="font-label-sm text-label-sm text-primary font-bold">{initials}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body-sm text-body-sm font-medium">
                      {member.name}
                      {member.designation && <span className="text-on-surface-variant font-normal"> ({member.designation})</span>}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {member.taskCount} {member.taskCount === 1 ? "Task" : "Tasks"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColorFor(member.widthPercent)}`}
                      style={{ width: `${member.widthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
