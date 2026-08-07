import React from "react";

export default function Notes() {
  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Meeting Notes</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Capture notes and keep a running timeline of client conversations.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Note
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="col-span-2 space-y-4">
            <article className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container">
                    <span className="material-symbols-outlined">article</span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface">Q4 Kickoff Notes</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Oct 12, 2023</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-tertiary">
                  <button className="rounded-lg p-2 hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined">edit</span></button>
                  <button className="rounded-lg p-2 hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined">share</span></button>
                  <button className="rounded-lg p-2 hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined">delete</span></button>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Discussed campaign goals, budget alignment, and measurement plans. Action items assigned to the media team.
              </p>
            </article>

            <article className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container">
                  <span className="material-symbols-outlined">notes</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Strategy Review</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Oct 05, 2023</p>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Reviewed channel performance and next quarter priorities for the Acme media plan.
              </p>
            </article>
          </section>

          <aside className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="font-title-sm text-title-sm text-on-surface mb-4">New Note</h2>
            <textarea className="w-full min-h-[220px] rounded-3xl border border-outline-variant bg-white p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary" placeholder="Write notes here..."></textarea>
            <div className="mt-4 flex justify-end gap-3">
              <button className="rounded-lg border border-outline-variant px-4 py-2 text-tertiary">Discard</button>
              <button className="rounded-lg bg-primary px-4 py-2 text-on-primary">Save Note</button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
