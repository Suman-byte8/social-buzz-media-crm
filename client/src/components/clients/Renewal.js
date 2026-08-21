import React from "react";

export default function Renewal({ client }) {
  const clientName = client?.name || "Client";
  const renewalDate = client?.renewal;

  const daysUntilRenewal = renewalDate
    ? Math.ceil((new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const renewalDateStr = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "N/A";

  const statusLabel = daysUntilRenewal !== null
    ? daysUntilRenewal <= 0
      ? "Expired"
      : daysUntilRenewal <= 7
      ? "Action Required Soon"
      : daysUntilRenewal <= 30
      ? "Upcoming"
      : "Active"
    : "Unknown";

  const statusColor = daysUntilRenewal !== null
    ? daysUntilRenewal <= 0
      ? "bg-error"
      : daysUntilRenewal <= 7
      ? "bg-error"
      : daysUntilRenewal <= 30
      ? "bg-tertiary-fixed-dim"
      : "bg-primary"
    : "bg-tertiary-fixed-dim";

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Renewal Details</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Manage contract renewal timelines and next-term recommendations for {clientName}.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            Draft New Terms
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">timer</span>
                  Next Renewal
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Master Services Agreement v2.1</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium gap-2 ${
                daysUntilRenewal !== null && daysUntilRenewal <= 7
                  ? "bg-error-container text-on-error-container"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}>
                <span className={`h-2 w-2 rounded-full animate-pulse ${statusColor}`}></span>
                {statusLabel}
              </span>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-primary text-[72px] leading-none">
                    {daysUntilRenewal !== null ? Math.abs(daysUntilRenewal) : "--"}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                    {daysUntilRenewal !== null ? "Days" : "N/A"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Target Date</p>
                  <p className="font-headline-sm text-headline-sm text-on-surface">{renewalDateStr}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-secondary-fixed bg-surface p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">Current Value</span>
                    <span className="font-title-lg text-title-lg text-on-surface">
                      {client?.monthlyRetainer
                        ? `$${client.monthlyRetainer.toLocaleString()}/mo`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="text-[#16a34a] font-label-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    {client?.contractValue
                      ? `$${client.contractValue.toLocaleString()} total contract`
                      : "No contract value on file"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 rounded-3xl border border-outline-variant bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="font-title-lg text-title-lg text-on-surface mb-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">payments</span>
                Current Value
              </h2>
              <p className="font-display-lg text-display-lg text-on-surface">
                {client?.contractValue
                  ? `$${client.contractValue.toLocaleString()}`
                  : "N/A"}
                {client?.renewalTerm ? <span className="font-body-md text-on-surface-variant text-[16px] font-normal"> {client.renewalTerm}</span> : ""}
              </p>
            </div>
            <div className="pt-6 border-t border-secondary-fixed">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Renewal Date</span>
                  <span className="font-label-md text-label-md text-on-surface block">{renewalDateStr}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-6 rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">tune</span>
                Renewal Strategy
              </h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-secondary-fixed bg-surface p-4 flex items-center justify-between gap-4 hover:bg-surface-container transition-colors cursor-pointer">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Proposed Increase</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Targeting 8% baseline bump</p>
                </div>
                <span className="font-title-lg text-title-lg text-on-surface">
                  {client?.monthlyRetainer
                    ? `$${(client.monthlyRetainer * 1.08).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}/mo`
                    : "N/A"}
                </span>
              </div>
              <div className="rounded-3xl border border-secondary-fixed bg-surface p-4 flex items-center justify-between gap-4 hover:bg-surface-container transition-colors cursor-pointer">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Term Length</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Standard commit</p>
                </div>
                <span className="font-title-lg text-title-lg text-on-surface">
                  {client?.renewalTerm || "12 Months"}
                </span>
              </div>
            </div>
            <div className="mt-6 border-t border-secondary-fixed pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Automated Reminders</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Send nudges at 30, 15, and 5 days.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox" defaultChecked={true} />
                  <div className="h-6 w-11 rounded-full bg-tertiary-fixed-dim peer-checked:bg-primary peer-focus:outline-none relative after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </section>

          <section className="lg:col-span-6 rounded-3xl border border-outline-variant bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">history</span>
                Contract History
              </h2>
              <button className="text-primary font-label-sm hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-secondary-fixed">
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase">Period</th>
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase">Value</th>
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-secondary-fixed hover:bg-[#F9F9F9] transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface">
                      {renewalDate
                        ? `${new Date(renewalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${renewalDateStr}`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 font-label-md text-label-md text-on-surface">
                      {client?.monthlyRetainer
                        ? `$${client.monthlyRetainer.toLocaleString()}/mo`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-xl bg-primary-fixed px-2 py-1 text-xs font-semibold text-on-primary-fixed-variant">Current</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
