import React from "react";

export default function MeetingNotesPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-container-margin">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-background">
              Meeting Notes
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Timeline view of client engagements and internal syncs.
            </p>
          </div>
          <button className="bg-primary text-white font-label-md text-label-md px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-tint transition-colors shadow-sm cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Meeting Note
          </button>
        </div>

        {/* Timeline View */}
        <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant before:to-transparent">
          {/* Entry 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-12">
            {/* Marker */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-surface-container-high shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="material-symbols-outlined text-primary text-[20px]">
                videocam
              </span>
            </div>
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-card-padding bg-white border border-[#E5E5E7] rounded-xl shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider bg-surface-container-highest px-2 py-1 rounded-full">
                  Client Sync
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Today, 10:00 AM
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-2">
                Q4 Digital Strategy Alignment
              </h3>
              {/* Attendees */}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Attendees:
                </span>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                    <img
                      className="w-full h-full object-cover"
                      alt="Attendee 1"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC53fJJjLvPvVQP0ykgL68EJQ8q1znHkirWZuIbnmLI6TE7BUJqnjf-JgzDdFVcSz0NRlyRlU5sdAtA3gidvgxs7Mz2_mbHvLvGpBu2TRqiMO4S5xtsVp-l75ql76hsxTHCfe7gv6U4KFRL7SLSyyOcVSdksShQWO6eP_GOBf4489LXlbJmlmAQTj1wTafWtoBuRINnzII8gAOpvg9SEcDbc01MZ9m4MvslNBGEu40Fmg_kf-znzy7D"
                    />
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                    <img
                      className="w-full h-full object-cover"
                      alt="Attendee 2"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0ClRLChmjzkpXJ66II86yUCNRoL9XDHzx6CEzhjXyoLxYur81Hih_0vMNs6T1GGCfMc2xGEjmEOr5A50fk1B48ByRw2ERM5NtfacXOzN1EzonPjR5k1WYEZSEBSXpil6KzCLmRwM0cYAT8Y_x-EToJS1CYGo7qIjcf3SUkqh0562_DOhpMHyPmgGMT0gSYhT_8QKgwnMfal0JI1zR5Tbr3sj4C0LtZDraFjNt3AtYhxiJHrlGGfs1"
                    />
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container flex items-center justify-center">
                    <span className="font-label-sm text-label-sm text-on-secondary-container">
                      +2
                    </span>
                  </div>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                Reviewed the upcoming Q4 campaign deliverables. Client approved
                the initial moodboards but requested adjustments to the ad copy
                targeting demographics.
              </p>
              {/* Action Items */}
              <div className="bg-surface-container-low rounded-lg p-3">
                <h4 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    task_alt
                  </span>{" "}
                  Action Items
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <input
                      className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      type="checkbox"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface">
                      Revise ad copy for Gen Z demographic
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <input
                      defaultChecked
                      className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      type="checkbox"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface line-through opacity-60">
                      Send updated moodboards to development team
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Entry 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-12">
            {/* Marker */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-surface-container-high shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="material-symbols-outlined text-primary text-[20px]">
                groups
              </span>
            </div>
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-card-padding bg-white border border-[#E5E5E7] rounded-xl shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider bg-secondary-container px-2 py-1 rounded-full">
                  Internal Sync
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Yesterday, 2:30 PM
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-2">
                Weekly Design Critique
              </h3>
              {/* Attendees */}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Attendees:
                </span>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                    <img
                      className="w-full h-full object-cover"
                      alt="Attendee 1"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUjAzS1NGl4Zgcy0lhecpczU14mQC6twEWAWLUq6itzwBH4BqxF9zoa_HN9HMWyPzGClSuRhAr0xMU9JpRtDMJAF7xIbfjVi4G2yaIf-1FFRcfiIGJW4ri8gxN44ZqOVJJPenObRCOL3PFJ5H0i_DyhTniD3xjoB4IV34hm5zySY7s_-OmzVyH-5SkNSfep4gpOGrZpJwcSo1j8G5sXZmySIrQc-QgjDPHgxWOiw1QeDhsyYPNC37-"
                    />
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                    <img
                      className="w-full h-full object-cover"
                      alt="Attendee 2"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAMQ_wiXD5j84I5yd6AiHzDuaaC6LMLcZN_3_ijf6tagdJSlutuI1G06wuaONdmfp71l5FNC1mD7oI34JPv8mbE0IOnj4uzrbYxuaQRTq4ojzpPUmltDhLT7U_G2a7N1fx9nYPzwh_uSOjtCdzuZMoUycIkbtcrcNiEWs3zW_vAi5RMPb6RaUNqhhpphlqDZywrJkiRKIDDd-mCM2jtwZZ5sYU_vyH1TwdLgaYuO0QcSHwywtqL_Y9"
                    />
                  </div>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                Internal review of the Acme Corp landing page concepts. Need to
                push the typography contrast further on mobile viewports.
              </p>
              {/* Action Items */}
              <div className="bg-surface-container-low rounded-lg p-3">
                <h4 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    task_alt
                  </span>{" "}
                  Action Items
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <input
                      className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      type="checkbox"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface">
                      Update Figma components with new color tokens
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
