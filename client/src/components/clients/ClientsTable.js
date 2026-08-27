"use client";

import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { getAssetUrl } from "@/services/apiClient";

const COLUMNS = [
  { key: "name", label: "Client Name" },
  { key: "industry", label: "Industry" },
  { key: "servicesSelected", label: "Services" },
  { key: "clientManagedBy", label: "Account Manager" },
  { key: "clientHealth", label: "Health" },
  { key: "id", label: "Actions" },
];

const getHealthColor = (health) => {
  if (health === null || health === undefined) return "gray";
  if (health >= 80) return "green";
  if (health >= 50) return "amber";
  return "red";
};

const getHealthLabel = (health) => {
  if (health === null || health === undefined) return "Not Scored";
  if (health >= 80) return "Excellent";
  if (health >= 50) return "Fair";
  return "At Risk";
};

const formatServices = (services) => {
  if (!services) return null;
  const arr = typeof services === "string" ? services.split(",").filter(Boolean) : services;
  return arr.slice(0, 3).map((s) => (
    <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
      {s.trim()}
    </span>
  ));
};

const initialsFor = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

export default function ClientsTable({
  clients,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  teamMemberMap = {},
}) {
  return (
    <div className="bg-white rounded-b-xl border border-outline-variant shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[900px] text-left border-collapse">
        <thead className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => col.key !== "id" && onSort(col.key)}
                className={`py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider select-none ${
                  col.key !== "id" ? "cursor-pointer hover:bg-gray-100" : ""
                } ${col.key === "id" ? "text-right" : ""}`}
              >
                <div className={`flex items-center gap-1 ${col.key === "id" ? "justify-end" : ""}`}>
                  {col.label}
                  {sortBy === col.key && (
                    <span className="material-symbols-outlined text-[16px]">
                      {sortOrder === "ASC" ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-body-sm font-body-sm">
          {loading ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-12 text-center text-secondary">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading clients...
              </td>
            </tr>
          ) : clients.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">domain_disabled</span>
                No clients found
              </td>
            </tr>
          ) : (
            clients.map((client) => {
              const manager = teamMemberMap[client.clientManagedBy];
              return (
                <tr key={client.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                  <td className="py-4 px-4">
                    <Link href={`/clients/${client.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            client.logo ? "" : "border border-outline-variant bg-primary-container/10"
                          }`}
                        >
                          {client.logo ? (
                            <img src={getAssetUrl(client.logo)} alt={client.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="font-bold text-primary">{initialsFor(client.name)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-title-lg text-title-lg text-on-surface">{client.name}</p>
                          <p className="text-secondary text-xs mt-0.5">ID: {client.id}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-secondary">{client.industry || "—"}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1.5">{formatServices(client.servicesSelected) || "—"}</div>
                  </td>
                  <td className="py-4 px-4">
                    {manager ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {initialsFor(manager.name)}
                        </div>
                        <span className="text-on-surface">{manager.name}</span>
                      </div>
                    ) : (
                      <span className="text-secondary">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={getHealthLabel(client.clientHealth)} color={getHealthColor(client.clientHealth)} showDot />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(client)}
                        className="text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors p-1.5"
                        title="Edit Client"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(client.id)}
                        className="text-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors p-1.5"
                        title="Delete Client"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors p-1.5"
                        title="View Profile"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
