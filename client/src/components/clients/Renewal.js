import React from "react";

export default function Renewal({ client }) {
  const clientName = client?.name || "Client";
  const renewalDate = client?.renewal;

  const daysUntilRenewal = renewalDate
    ? Math.ceil((new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const renewalDateStr = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "Not set";

  const statusLabel = daysUntilRenewal !== null
    ? daysUntilRenewal <= 0
      ? "Expired"
      : daysUntilRenewal <= 7
      ? "Action Required Soon"
      : daysUntilRenewal <= 30
      ? "Upcoming"
      : "Active"
    : "No renewal date set";

  const statusColor = daysUntilRenewal !== null
    ? daysUntilRenewal <= 7
      ? "bg-error"
      : daysUntilRenewal <= 30
      ? "bg-tertiary-fixed-dim"
      : "bg-primary"
    : "bg-tertiary-fixed-dim";

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Renewal Details</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Contract renewal timeline for {clientName}. Set or update the renewal date from Edit Client.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">timer</span>
              Next Renewal
            </h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium gap-2 ${
              daysUntilRenewal !== null && daysUntilRenewal <= 7
                ? "bg-error-container text-on-error-container"
                : "bg-surface-container-low text-on-surface-variant"
            }`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${statusColor}`}></span>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-primary text-[72px] leading-none">
                {daysUntilRenewal !== null ? Math.abs(daysUntilRenewal) : "--"}
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                {daysUntilRenewal !== null ? (daysUntilRenewal < 0 ? "Days Overdue" : "Days Left") : "N/A"}
              </span>
            </div>
            <div className="text-right">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Renewal Date</p>
              <p className="font-headline-sm text-headline-sm text-on-surface">{renewalDateStr}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
