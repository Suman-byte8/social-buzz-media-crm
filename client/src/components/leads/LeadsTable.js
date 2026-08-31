"use client";

import React from "react";
import LeadRowMenu from "./LeadRowMenu";
import LeadRowEditor from "./LeadRowEditor";

const AVATAR_PALETTE = [
  { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
  { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700" },
];

const STATUS_CONFIG = {
  new: { label: "New", dot: "bg-outline-variant", classes: "bg-surface-container-low border border-outline-variant/50 text-on-surface-variant" },
  contacted: { label: "Contacted", dot: "bg-blue-500", classes: "bg-blue-50 text-blue-700" },
  qualified: { label: "Qualified", dot: "bg-green-500", classes: "bg-green-50 text-green-700" },
  hot: { label: "Hot Prospect", dot: "bg-red-500", classes: "bg-red-50 text-red-700" },
  lost: { label: "Lost", dot: "bg-gray-400", classes: "bg-gray-100 text-gray-600" },
};

const formatDate = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

const formatFollowUp = (value, status) => {
  if (!value) return { text: "Needs Scheduling", overdue: false, plain: true };
  const date = new Date(value);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const overdue = date < now && !isSameDay(date, now) && status !== "lost";

  if (isSameDay(date, now)) return { text: `Today, ${time}`, overdue: status !== "lost", plain: false };
  if (isSameDay(date, tomorrow)) return { text: `Tomorrow, ${time}`, overdue: false, plain: false };
  if (overdue) return { text: `Overdue — ${formatDate(value)}`, overdue: true, plain: false };
  return { text: formatDate(value), overdue: false, plain: true };
};

const initialsFor = (name) => (name ? name[0]?.toUpperCase() : "?");

export default function LeadsTable({
  leads,
  loading,
  onEdit,
  onDelete,
  onConvert,
  onLogCall,
  onSendEmail,
  onSchedule,
  draftRows = [],
  onDraftChange,
  onSaveDraft,
  onDiscardDraft,
  savingDraftId,
  draftErrors = {},
}) {
  const hasDrafts = draftRows.length > 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Company &amp; Contact</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Source</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Last Contact</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Next Follow-up</th>
            <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-body-sm">
          {loading ? (
            <tr>
              <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                <span className="animate-spin material-symbols-outlined align-middle mr-2">progress_activity</span>
                Loading leads...
              </td>
            </tr>
          ) : leads.length === 0 && !hasDrafts ? (
            <tr>
              <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-1.5 mx-auto">person_search</span>
                No leads found
              </td>
            </tr>
          ) : (
            <>
            {draftRows.map((draft) => (
              <LeadRowEditor
                key={draft.tempId}
                values={draft}
                onChange={(field, value) => onDraftChange(draft.tempId, field, value)}
                onSave={() => onSaveDraft(draft.tempId)}
                onCancel={() => onDiscardDraft(draft.tempId)}
                saving={savingDraftId === draft.tempId}
                error={draftErrors[draft.tempId]}
              />
            ))}
            {leads.map((lead, idx) => {
              const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
              const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
              const followUp = formatFollowUp(lead.nextFollowUpAt, lead.status);

              return (
                <tr key={lead.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center font-title-lg text-title-lg border ${palette.bg} ${palette.border} ${palette.text}`}>
                        {initialsFor(lead.companyName)}
                      </div>
                      <div>
                        <p className="font-title-lg text-title-lg text-on-background mb-0.5">{lead.companyName}</p>
                        {lead.contactName && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                            {lead.contactName}
                            {lead.email && (
                              <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: 14 }}>mail</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-on-surface-variant">{lead.source || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl font-label-sm text-label-sm ${statusConfig.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot}`}></span>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">{formatDate(lead.lastContactAt)}</td>
                  <td className="p-4">
                    {followUp.plain ? (
                      <span className="text-on-surface-variant">{followUp.text}</span>
                    ) : (
                      <span className={`font-medium flex items-center gap-1 ${followUp.overdue ? "text-error" : "text-on-background"}`}>
                        {followUp.overdue && (
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                        )}
                        {followUp.text}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSendEmail(lead)}
                        disabled={!lead.email}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Send Email"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
                      </button>
                      <button
                        onClick={() => onLogCall(lead)}
                        disabled={!lead.phone}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Log Call"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>call</span>
                      </button>
                      <button
                        onClick={() => onSchedule(lead)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors"
                        title="Schedule Follow-up"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event</span>
                      </button>
                      <LeadRowMenu
                        onEdit={() => onEdit(lead)}
                        onConvert={() => onConvert(lead)}
                        onDelete={() => onDelete(lead)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
