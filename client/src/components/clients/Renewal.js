import React from "react";

export default function Renewal() {
  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Renewal Details</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Manage contract renewal timelines and next-term recommendations.
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
              <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 text-on-error-container text-sm font-medium gap-2">
                <span className="h-2 w-2 rounded-full bg-error animate-pulse"></span>
                Action Required Soon
              </span>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-primary text-[72px] leading-none">45</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant">Days</span>
                </div>
                <div className="text-right">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Target Date</p>
                  <p className="font-headline-sm text-headline-sm text-on-surface">Oct 15, 2024</p>
                </div>
              </div>
              <div className="rounded-3xl border border-secondary-fixed bg-surface p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">Current Value</span>
                    <span className="font-title-lg text-title-lg text-on-surface">$12,500/mo</span>
                  </div>
                  <div className="text-[#16a34a] font-label-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +15% vs previous term
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
                $150,000 <span className="font-body-md text-on-surface-variant text-[16px] font-normal">/12 mo</span>
              </p>
            </div>
            <div className="pt-6 border-t border-secondary-fixed">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Total Contract Value</span>
                <span className="font-label-md text-label-md text-on-surface">$150,000</span>
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
                <span className="font-title-lg text-title-lg text-on-surface">$13,500/mo</span>
              </div>
              <div className="rounded-3xl border border-secondary-fixed bg-surface p-4 flex items-center justify-between gap-4 hover:bg-surface-container transition-colors cursor-pointer">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Term Length</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Standard commit</p>
                </div>
                <span className="font-title-lg text-title-lg text-on-surface">12 Months</span>
              </div>
            </div>
            <div className="mt-6 border-t border-secondary-fixed pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Automated Reminders</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Send nudges at 30, 15, and 5 days.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox" />
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
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface">Oct 2023 - Oct 2024</td>
                    <td className="px-4 py-3 font-label-md text-label-md text-on-surface">$12,500/mo</td>
                    <td className="px-4 py-3"><span className="rounded-xl bg-primary-fixed px-2 py-1 text-xs font-semibold text-on-primary-fixed-variant">Current</span></td>
                  </tr>
                  <tr className="border-b border-secondary-fixed hover:bg-[#F9F9F9] transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface">Oct 2022 - Oct 2023</td>
                    <td className="px-4 py-3 font-label-md text-label-md text-on-surface">$10,870/mo</td>
                    <td className="px-4 py-3"><span className="rounded-xl bg-tertiary-fixed px-2 py-1 text-xs font-semibold text-tertiary">Completed</span></td>
                  </tr>
                  <tr className="hover:bg-[#F9F9F9] transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface">Oct 2021 - Oct 2022</td>
                    <td className="px-4 py-3 font-label-md text-label-md text-on-surface">$9,500/mo</td>
                    <td className="px-4 py-3"><span className="rounded-xl bg-tertiary-fixed px-2 py-1 text-xs font-semibold text-tertiary">Completed</span></td>
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
