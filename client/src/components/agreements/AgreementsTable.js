"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import AgreementEmailButton from "./AgreementEmailButton";

const STATUS_META = {
  active: { label: "Active", color: "green" },
  pending_signature: { label: "Pending Signature", color: "amber" },
  expired: { label: "Expired", color: "red" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const isExpiringSoon = (agreement) => {
  if (!agreement.expiryDate || agreement.status !== "active") return false;
  const daysLeft = (new Date(agreement.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
  return daysLeft >= 0 && daysLeft <= 30;
};

export default function AgreementsTable({
  agreements,
  loading,
  clients = [],
  getClientName,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-b-xl border border-outline-variant shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[860px] text-left border-collapse">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Agreement</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Client</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Issued</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Expires</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-body-sm font-body-sm">
          {loading ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-secondary">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading agreements...
              </td>
            </tr>
          ) : agreements.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">description</span>
                No agreements found.
              </td>
            </tr>
          ) : (
            agreements.map((agreement) => {
              const meta = STATUS_META[agreement.status] || { label: agreement.status || "Unknown", color: "gray" };
              const expiringSoon = isExpiringSoon(agreement);
              const client = clients.find((c) => c.id === agreement.clientId) || null;
              return (
                <tr key={agreement.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[24px] shrink-0">description</span>
                      <div className="min-w-0">
                        <a
                          href={agreement.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-title-md text-title-md text-on-surface hover:text-primary transition-colors truncate block max-w-[240px]"
                          title={agreement.fileName}
                        >
                          {agreement.fileName}
                        </a>
                        <p className="text-xs text-secondary truncate max-w-[240px]" title={agreement.description}>
                          {agreement.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-on-surface">{getClientName(agreement.clientId)}</td>
                  <td className="py-4 px-4 text-secondary whitespace-nowrap">{formatDate(agreement.issuedDate)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={expiringSoon ? "text-amber-700 font-medium" : "text-secondary"}>
                      {formatDate(agreement.expiryDate)}
                    </span>
                    {expiringSoon && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-amber-700" title="Expiring within 30 days">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        soon
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={meta.label} color={meta.color} showDot />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView(agreement)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors"
                        title="View Agreement"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <AgreementEmailButton agreement={agreement} client={client} />
                      <button
                        onClick={() => onEdit(agreement)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors"
                        title="Edit Agreement"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(agreement.id)}
                        className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Agreement"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
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
