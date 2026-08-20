import React from "react";

export default function TasksPage() {
  return (
    <main className="h-screen max-h-screen p-4 flex flex-col gap-3 overflow-hidden bg-background">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="font-bold text-xl text-on-background leading-tight">
            Task Management
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Track and manage agency deliverables
          </p>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-primary-container transition-colors shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Task
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-outline-variant shrink-0 text-xs">
        <button className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-md border border-outline-variant hover:bg-surface-container-high transition-colors font-label-md text-xs text-on-surface">
          <span className="material-symbols-outlined text-[14px]">
            filter_list
          </span>{" "}
          Filter
        </button>
        <div className="relative">
          <select className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface text-xs rounded-md pl-2.5 pr-7 py-1 focus:ring-primary/20">
            <option>Client: All</option>
            <option>Acme Corp</option>
            <option>Stark Industries</option>
          </select>
          <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-on-surface-variant">
            expand_more
          </span>
        </div>
        <div className="relative">
          <select className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface text-xs rounded-md pl-2.5 pr-7 py-1 focus:ring-primary/20">
            <option>Assignee: All</option>
            <option>Me</option>
            <option>Design Team</option>
          </select>
          <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-on-surface-variant">
            expand_more
          </span>
        </div>
        <div className="relative">
          <select className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface text-xs rounded-md pl-2.5 pr-7 py-1 focus:ring-primary/20">
            <option>Priority: All</option>
            <option>Urgent</option>
            <option>High</option>
            <option>Medium</option>
          </select>
          <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-on-surface-variant">
            expand_more
          </span>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center bg-surface-container rounded-md p-0.5 border border-outline-variant">
          <button className="p-1 rounded bg-surface-container-lowest shadow-xs text-on-surface">
            <span className="material-symbols-outlined text-[16px]">
              view_kanban
            </span>
          </button>
          <button className="p-1 rounded text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">
              format_list_bulleted
            </span>
          </button>
        </div>
      </div>

      {/* Kanban Board - Compact 5-column layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2.5 min-h-0 overflow-hidden w-full">
        {/* Column 1: Backlog */}
        <div className="flex flex-col gap-2 min-w-0 h-full overflow-hidden bg-surface-container-low/40 rounded-lg p-2 border border-outline-variant/30">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-semibold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              Backlog
              <span className="bg-surface-variant text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px] font-normal">
                2
              </span>
            </h3>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
            {/* Task Card */}
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant p-2.5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-[10px] font-medium truncate">
                  Wayne Ent.
                </span>
                <span className="bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  Low
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-background line-clamp-2 leading-snug">
                Website Redesign Discovery Phase
              </h4>
              <div className="flex items-center justify-between pt-1.5 border-t border-surface-container text-[11px]">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      calendar_today
                    </span>
                    Oct 28
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      checklist
                    </span>
                    0/8
                  </div>
                </div>
                <img
                  className="w-5 h-5 rounded-full object-cover border border-outline-variant"
                  alt="Assignee Avatar"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: To Do */}
        <div className="flex flex-col gap-2 min-w-0 h-full overflow-hidden bg-surface-container-low/40 rounded-lg p-2 border border-outline-variant/30">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-semibold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              To Do
              <span className="bg-surface-variant text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px] font-normal">
                3
              </span>
            </h3>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
            {/* Task Card 1 */}
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant p-2.5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-[10px] font-medium truncate">
                  Acme Corp
                </span>
                <span className="bg-error-container text-on-error-container px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0">
                  Urgent
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-background line-clamp-2 leading-snug">
                Q3 SEO Audit Final Report Presentation
              </h4>
              <div className="flex items-center justify-between pt-1.5 border-t border-surface-container text-[11px]">
                <div className="flex items-center gap-2 text-error font-semibold">
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      calendar_today
                    </span>
                    Today
                  </div>
                  <div className="flex items-center gap-0.5 text-on-surface-variant font-normal">
                    <span className="material-symbols-outlined text-[12px]">
                      checklist
                    </span>
                    4/5
                  </div>
                </div>
                <img
                  className="w-5 h-5 rounded-full object-cover border border-outline-variant"
                  alt="Assignee Avatar"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                />
              </div>
            </div>
            {/* Task Card 2 */}
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant p-2.5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-[10px] font-medium truncate">
                  Internal
                </span>
                <span className="bg-tertiary-container text-on-tertiary-container px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  High
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-background line-clamp-2 leading-snug">
                Invoice Follow-up for September Retainers
              </h4>
              <div className="flex items-center justify-between pt-1.5 border-t border-surface-container text-[11px]">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      calendar_today
                    </span>
                    Oct 25
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: In Progress */}
        <div className="flex flex-col gap-2 min-w-0 h-full overflow-hidden bg-surface-container-low/60 rounded-lg p-2 border border-primary/20">
          <div className="flex items-center justify-between px-1 shrink-0 pb-1 border-b border-primary/20">
            <h3 className="font-semibold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
              In Progress
              <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full text-[10px] font-normal">
                2
              </span>
            </h3>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
            {/* Task Card */}
            <div className="bg-surface-container-lowest rounded-md border border-primary/30 p-2.5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div className="flex items-center justify-between gap-1 pl-1.5">
                <span className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-[10px] font-medium truncate">
                  Stark Ind.
                </span>
                <span className="bg-tertiary-container text-on-tertiary-container px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  High
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-background line-clamp-2 leading-snug pl-1.5">
                Meta Ad Creative Copy Variations
              </h4>
              <div className="flex items-center justify-between pt-1.5 border-t border-surface-container pl-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      calendar_today
                    </span>
                    Oct 24
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      checklist
                    </span>
                    2/5
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  <img
                    className="w-5 h-5 rounded-full object-cover border border-surface-container-lowest"
                    alt="Assignee 1"
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
                  />
                  <img
                    className="w-5 h-5 rounded-full object-cover border border-surface-container-lowest"
                    alt="Assignee 2"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Review */}
        <div className="flex flex-col gap-2 min-w-0 h-full overflow-hidden bg-surface-container-low/40 rounded-lg p-2 border border-outline-variant/30">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-semibold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              Review
              <span className="bg-surface-variant text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px] font-normal">
                1
              </span>
            </h3>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
            {/* Task Card */}
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant p-2.5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-[10px] font-medium truncate">
                  Global Tech
                </span>
                <span className="bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  Medium
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-background line-clamp-2 leading-snug">
                Q4 Social Media Content Calendar Draft
              </h4>
              <div className="flex items-center justify-between pt-1.5 border-t border-surface-container text-[11px]">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">
                      calendar_today
                    </span>
                    Oct 26
                  </div>
                  <div className="flex items-center gap-0.5 text-primary">
                    <span className="material-symbols-outlined text-[12px]">
                      chat_bubble
                    </span>
                    3
                  </div>
                </div>
                <img
                  className="w-5 h-5 rounded-full object-cover border border-outline-variant"
                  alt="Assignee Avatar"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 5: Completed */}
        <div className="flex flex-col gap-2 min-w-0 h-full overflow-hidden bg-surface-container-low/40 rounded-lg p-2 border border-outline-variant/30">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              Completed
              <span className="bg-surface-variant text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px] font-normal">
                12
              </span>
            </h3>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none opacity-80">
            {/* Task Card */}
            <div className="bg-surface-container rounded-md border border-outline-variant/50 p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-on-surface-variant text-[10px] font-medium">
                  Acme Corp
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-surface-variant line-clamp-2 line-through leading-snug">
                Setup Google Analytics 4 Properties
              </h4>
              <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/30 text-[11px]">
                <div className="flex items-center gap-0.5 text-secondary">
                  <span className="material-symbols-outlined text-[12px]">
                    check_circle
                  </span>
                  Oct 20
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
