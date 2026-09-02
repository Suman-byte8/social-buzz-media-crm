"use client";

import React from "react";
import { CLIENT_INDUSTRY_OPTIONS } from "@/lib/clientIndustries";

export default function ClientsFilters({
  search,
  onSearchChange,
  industry,
  onIndustryChange,
  healthMin,
  onHealthMinChange,
  healthMax,
  onHealthMaxChange,
  managedBy,
  onManagedByChange,
  teamMembers = [],
}) {
  return (
    <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-outline-variant shadow-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <input
          value={search}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
          placeholder="Search clients..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap overflow-x-auto">
        <select
          value={industry}
          onChange={onIndustryChange}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">All Industries</option>
          {CLIENT_INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={managedBy}
          onChange={onManagedByChange}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">All Managers</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>

        <select
          value={healthMin}
          onChange={onHealthMinChange}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">Min Health</option>
          <option value="0">0%</option>
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
        </select>

        <select
          value={healthMax}
          onChange={onHealthMaxChange}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">Max Health</option>
          <option value="100">100%</option>
          <option value="75">75%</option>
          <option value="50">50%</option>
          <option value="25">25%</option>
        </select>
      </div>
    </div>
  );
}
