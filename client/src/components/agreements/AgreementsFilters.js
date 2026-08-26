"use client";

import React from "react";

export default function AgreementsFilters({
  search,
  onSearchChange,
  clientFilter,
  onClientChange,
  statusFilter,
  onStatusChange,
  clients,
}) {
  return (
    <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-outline-variant shadow-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
          placeholder="Search by file name or description..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <select
          value={clientFilter}
          onChange={(e) => onClientChange(e.target.value)}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">All Clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending_signature">Pending Signature</option>
          <option value="expired">Expired</option>
        </select>
      </div>
    </div>
  );
}
