"use client";

import React from "react";
import TeamMemberRow from "@/components/teams/TeamMemberRow";

export default function TeamTable({ members, workloadById, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
            <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[25%]">Team Member</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">Status</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[20%]">Current Work</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">Clients Handling</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">Workload</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[10%] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="font-body-sm text-body-sm divide-y divide-[#F0F0F0]">
          {members.length > 0 ? (
            members.map((member) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                workload={workloadById[member.id] || { openTaskCount: 0, widthPercent: 0 }}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-8 px-4 text-center text-on-surface-variant">
                No team members found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
