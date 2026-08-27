"use client";

import React from "react";
import { TYPE_OF_WORK_OPTIONS, STATUS_OPTIONS } from "./constants";

export default function MiscTaskFilters({
  clientFilter,
  onClientChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  clients,
}) {
  return (
    <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-outline-variant shadow-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
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
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
      >
        <option value="">All Types</option>
        {TYPE_OF_WORK_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
      >
        <option value="">All Status</option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
