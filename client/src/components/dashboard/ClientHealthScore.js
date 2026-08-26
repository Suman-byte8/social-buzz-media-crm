"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

const healthMeta = (score) => {
  if (score === null || score === undefined) {
    return { status: "Not Scored", color: "bg-gray-50", textColor: "text-gray-600", borderColor: "border-gray-200", dotColor: "bg-gray-400" };
  }
  if (score >= 80) return { status: "Excellent", color: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-100", dotColor: "bg-emerald-500" };
  if (score >= 60) return { status: "Good", color: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-100", dotColor: "bg-emerald-500" };
  if (score >= 40) return { status: "Needs Attn", color: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-100", dotColor: "bg-amber-500" };
  return { status: "At Risk", color: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-100", dotColor: "bg-red-500" };
};

const parseServices = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed : [field];
  } catch {
    return field.split(",").map((s) => s.trim()).filter(Boolean);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export default function ClientHealthScore({ clients = [], loading }) {
  const [sortBy, setSortBy] = useState("risk");

  const sortedClients = useMemo(() => {
    const list = [...clients];
    if (sortBy === "risk") {
      list.sort((a, b) => (a.clientHealth ?? 999) - (b.clientHealth ?? 999));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "renewal") {
      list.sort((a, b) => new Date(a.renewal || "9999-12-31") - new Date(b.renewal || "9999-12-31"));
    }
    return list.slice(0, 10);
  }, [clients, sortBy]);

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-0 shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
      <div className="p-card-padding flex justify-between items-center bg-white border-b border-[#F0F0F0]">
        <h2 className="font-title-lg text-title-lg text-on-surface">
          Client Health Score
        </h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-50 border border-[#E5E5E7] text-sm rounded-md focus:ring-primary focus:border-primary block p-2 font-label-sm text-label-sm"
        >
          <option value="risk">Sort by: Risk Level</option>
          <option value="renewal">Sort by: Renewal Date</option>
          <option value="name">Sort by: Name</option>
        </select>
      </div>

      {loading ? (
        <div className="p-card-padding space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : sortedClients.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant py-8 text-center">No clients yet.</p>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                  Client
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                  Service
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                  Renewal
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                  Health
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {sortedClients.map((client) => {
                const services = parseServices(client.servicesSelected);
                const health = healthMeta(client.clientHealth);
                return (
                  <tr key={client.id}>
                    <td className="py-3 px-4">
                      <div className="font-body-sm text-body-sm font-medium text-on-surface">
                        {client.name}
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        Since {formatDate(client.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                      {services.length > 0 ? services.join(", ") : "—"}
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm">
                      {client.renewal ? formatDate(client.renewal) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${health.color} ${health.textColor} border ${health.borderColor}`}>
                        <span className={`w-2 h-2 rounded-full ${health.dotColor} mr-1.5`}></span>
                        {health.status}
                        {client.clientHealth !== null && client.clientHealth !== undefined && ` (${client.clientHealth})`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/clients/${client.id}`} className="text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
