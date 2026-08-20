import React from "react";

export default function TeamPage() {
  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Team</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage agency personnel, workloads, and assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded bg-white border border-[#1A1A1A] text-[#1A1A1A] font-label-md text-label-md flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button className="h-10 px-4 rounded bg-[#e8262a] text-white font-label-md text-label-md flex items-center gap-2 hover:bg-[#c00016] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Team Member
          </button>
        </div>
      </div>

      {/* Stats Bar (Bento style minimal cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-[#E5E5E7] p-5 shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Total Members</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">42</div>
        </div>
        <div className="bg-white rounded-lg border border-[#E5E5E7] p-5 shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Active Now</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">38</div>
        </div>
        <div className="bg-white rounded-lg border border-[#E5E5E7] p-5 shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">person_add</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Available for Work</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">6</div>
        </div>
        <div className="bg-white rounded-lg border border-[#E5E5E7] p-5 shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[18px] text-purple-600">task_alt</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">Tasks Completed This Week</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface flex items-baseline gap-2">
            124
            <span className="font-label-md text-label-md text-green-600 flex items-center">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> +12%
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-t-lg border border-[#E5E5E7] border-b-0 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#E5E5E7] rounded focus:ring-1 focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all"
            placeholder="Search team members..."
            type="text"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select className="py-2 pl-3 pr-8 bg-gray-50 border border-[#E5E5E7] rounded font-body-sm text-body-sm outline-none focus:ring-1 focus:ring-primary text-on-surface">
            <option>All Departments</option>
            <option>Social Media</option>
            <option>Tech &amp; Dev</option>
            <option>Creative &amp; Design</option>
            <option>Strategy</option>
          </select>
          <select className="py-2 pl-3 pr-8 bg-gray-50 border border-[#E5E5E7] rounded font-body-sm text-body-sm outline-none focus:ring-1 focus:ring-primary text-on-surface">
            <option>Any Availability</option>
            <option>Available</option>
            <option>At Capacity</option>
            <option>Away</option>
          </select>
          <button className="p-2 border border-[#E5E5E7] rounded text-on-surface-variant hover:bg-gray-50">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-b-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
              <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[25%]">
                Team Member
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">
                Status
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[20%]">
                Current Work
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">
                Clients Handling
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">
                Workload
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[10%] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm divide-y divide-[#F0F0F0]">
            {/* Row 1 */}
            <tr className="hover:bg-[#F9F9F9] transition-colors group">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaHWCbVnhIhPfFDQM_MiwSUMJ0UOLEhF9kMWxbTcoGBi5fHi3xntFa0_a23WgWh7qPQ3l-7P9cpwVB5tu7k3P7HAOsSJc983JSTvk4EF7E_-fx8XrwEgnJsCfJ9KOOHKtndRVFd9bhrhOKEJlEvhbN1zrCQAxas2cdDajj_kTxMV6jPXz_-1L_9ZCzSCjcGEa_h0t1qyltPV6LkMLWbOrlWoA3CPN-6RMsttw5D3WycNLHusF1KwSx"
                      alt="Sarah Jenkins"
                    />
                  </div>
                  <div>
                    <div className="font-title-lg text-title-lg text-on-surface">Sarah Jenkins</div>
                    <div className="text-tertiary">Senior Social Media Mgr</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-green-50 text-green-700 font-label-sm text-label-sm border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="text-on-surface font-medium truncate max-w-[200px]">Q3 Campaign Strategy</div>
                <div className="text-tertiary text-xs truncate max-w-[200px]">Due: Tomorrow, 5PM</div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-secondary border border-gray-200">Nike</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-secondary border border-gray-200">Apple</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-secondary border border-gray-200">+2</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#e8262a] w-[85%]"></div>
                  </div>
                  <span className="text-xs text-tertiary font-medium">85%</span>
                </div>
                <div className="text-xs text-tertiary">12 Tasks (4 Pending)</div>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="text-tertiary hover:text-primary transition-colors p-1" title="Manage">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </td>
            </tr>

            {/* Row 2 */}
            <tr className="hover:bg-[#F9F9F9] transition-colors group">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_bM5-BpyqgKSpNePjlinVUY53_2a4tZ4B0p9e2cWZP96V03QaP9ud849sj6Sw6Bvqks8ly9-hER3OkAK8-GExdIj0EI_q6EyVbpuJm8gB5utS5y5hoEgNfNtgYhkXRWbHGoOWoO9k-BUNaLkPEHp_cM6tRTW8ys2HY9kjsnyBkh-w0VcXYe-npr8E4bPVQ6EomsNodFUASSzYXBcdGm9mQlC4yIKBIsSYCNfgR9c9YCjHgb2SSDkw"
                      alt="David Chen"
                    />
                  </div>
                  <div>
                    <div className="font-title-lg text-title-lg text-on-surface">David Chen</div>
                    <div className="text-tertiary">Frontend Developer</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-green-50 text-green-700 font-label-sm text-label-sm border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="text-on-surface font-medium truncate max-w-[200px]">E-commerce React Migration</div>
                <div className="text-tertiary text-xs truncate max-w-[200px]">Sprint 4 Tasks</div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-secondary border border-gray-200">Shopify Plus</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[60%]"></div>
                  </div>
                  <span className="text-xs text-tertiary font-medium">60%</span>
                </div>
                <div className="text-xs text-tertiary">5 Tasks (2 Pending)</div>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="text-tertiary hover:text-primary transition-colors p-1" title="Manage">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </td>
            </tr>

            {/* Row 3 */}
            <tr className="hover:bg-[#F9F9F9] transition-colors group">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-secondary border border-gray-300">
                    <span className="font-title-lg">MA</span>
                  </div>
                  <div>
                    <div className="font-title-lg text-title-lg text-on-surface">Marcus Allen</div>
                    <div className="text-tertiary">UI/UX Designer</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 font-label-sm text-label-sm border border-orange-100">
                  <span className="material-symbols-outlined text-[14px]">flight</span> Away (OOO)
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="text-tertiary italic truncate max-w-[200px]">On Leave until Oct 15</div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-tertiary italic">Reassigned temporary</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-300 w-[0%]"></div>
                  </div>
                  <span className="text-xs text-tertiary font-medium">0%</span>
                </div>
                <div className="text-xs text-tertiary">0 Tasks</div>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="text-tertiary hover:text-primary transition-colors p-1" title="Manage">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#F0F0F0] flex items-center justify-between bg-white rounded-b-lg">
          <span className="text-xs text-tertiary">Showing 1 to 3 of 42 members</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded text-tertiary hover:bg-gray-100 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded bg-[#e8262a] text-white font-label-sm text-label-sm flex items-center justify-center">
              1
            </button>
            <button className="w-8 h-8 rounded text-tertiary hover:bg-gray-100 font-label-sm text-label-sm flex items-center justify-center">
              2
            </button>
            <button className="w-8 h-8 rounded text-tertiary hover:bg-gray-100 font-label-sm text-label-sm flex items-center justify-center">
              3
            </button>
            <span className="text-tertiary px-1">...</span>
            <button className="p-1 rounded text-tertiary hover:bg-gray-100">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
