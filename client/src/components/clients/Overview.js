import React from "react";

export default function Overview() {
  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Client Overview</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              High-level client summary, account health, recent activity, and campaign status.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-[18px]">insights</span>
              View Insights
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-on-surface font-label-md text-label-md hover:border-primary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share Report
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <article className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-sm text-title-sm text-on-surface-variant mb-3">Monthly Retainer</h2>
            <p className="font-headline-sm text-headline-sm text-on-surface">$12,500</p>
            <span className="mt-3 inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
              Stable over last 30 days
            </span>
          </article>

          <article className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-sm text-title-sm text-on-surface-variant mb-3">Active Campaigns</h2>
            <p className="font-headline-sm text-headline-sm text-on-surface">8</p>
            <span className="mt-3 inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
              2 launching this week
            </span>
          </article>

          <article className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-sm text-title-sm text-on-surface-variant mb-3">Total Spend</h2>
            <p className="font-headline-sm text-headline-sm text-on-surface">$71,400</p>
            <span className="mt-3 inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
              +9.8% vs prior period
            </span>
          </article>

          <article className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-sm text-title-sm text-on-surface-variant mb-3">Open Issues</h2>
            <p className="font-headline-sm text-headline-sm text-error">3</p>
            <span className="mt-3 inline-flex items-center rounded-full bg-error-container/10 px-3 py-1 text-xs font-medium text-error">
              1 overdue deliverable
            </span>
          </article>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface">Recent Activity</h2>
              <button className="text-primary font-label-sm hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-surface-container-lowest p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Oct 24, 2024</p>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Approved new Meta Ads budget for Q4 launch</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Budget</span>
                </div>
              </div>
              <div className="rounded-3xl bg-surface-container-lowest p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Oct 18, 2024</p>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Shared performance deck for September campaigns</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">Report</span>
                </div>
              </div>
              <div className="rounded-3xl bg-surface-container-lowest p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Oct 12, 2024</p>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Reviewed social media strategy with client team</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">Strategy</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-4">Key Contacts</h2>
            <div className="space-y-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Primary Decision Maker</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">Sarah Jenkins</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Finance Lead</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">Miles Carter</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Media Lead</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">Leah Kim</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
