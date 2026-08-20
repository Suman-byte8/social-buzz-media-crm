import React from "react";
import SearchBar from "@/components/dashboard/SearchBar";
import MetricCard from "@/components/ui/MetricCard";

export default function DashboardPage() {
  return (
    <>
      {/* TopNavBar Header */}
      <header className="h-16 w-full sticky top-0 z-40 bg-surface dark:bg-surface border-b border-outline-variant shadow-sm flex justify-between items-center px-gutter">
        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-primary hover:text-primary transition-colors cursor-pointer active:opacity-80 p-2">
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Search Input Component */}
        <div className="flex-1 flex items-center ml-2 md:ml-0">
          <SearchBar />
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex space-x-2">
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 rounded-full hover:bg-black/5">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 rounded-full hover:bg-black/5">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <button className="hidden sm:block font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 px-3 py-1.5 border border-transparent hover:border-outline-variant rounded-md">
            Support
          </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden cursor-pointer flex items-center justify-center flex-shrink-0">
                <img
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                />
              </div>
        </div>
      </header>

      {/* Main Canvas Content */}
      <main className="flex-1 p-gutter md:p-container-margin w-full max-w-[1440px] mx-auto">
        <div className="mb-stack-lg flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
              CEO Dashboard
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Overview of agency performance and operations.
            </p>
          </div>
          <div className="hidden sm:flex space-x-2">
            <button className="px-4 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded-lg font-label-md text-label-md hover:bg-gray-50 transition-colors">
              Generate Report
            </button>
            <button className="px-4 py-2 bg-[#E8262A] text-white rounded-lg font-label-md text-label-md hover:bg-[#c91d21] shadow-sm transition-colors">
              New Client
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-stack-md lg:gap-stack-lg">
          {/* ROW 1: METRICS */}
          <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-stack-sm md:gap-stack-md">
            <MetricCard
              title="Active Clients"
              value="42"
              change="+3 this mo"
              changeType="positive"
              icon="domain"
            />
            <MetricCard
              title="MRR"
              value="$128k"
              change="12%"
              changeType="positive"
              icon="payments"
            />
            <MetricCard
              title="Out. Invoices"
              value="$24.5k"
              change="4 Overdue"
              changeType="negative"
              icon="receipt_long"
            />
            <MetricCard
              title="Active Google Ads"
              value="156"
              change="All Healthy"
              icon="ads_click"
            />
            <MetricCard
              title="Active Meta Camp."
              value="89"
              change="$12k/day spend"
              icon="campaign"
            />
          </div>

          {/* ROW 2: CHARTS & PIPELINE */}
          {/* Team Workload */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface">
                Team Workload
              </h2>
              <button className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="space-y-4">
              {/* Bar 1 */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  <img
                    alt="Creative director headshot"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body-sm text-body-sm font-medium">
                      Sarah Jenkins (Design)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      24 Tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bar 2 */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  <img
                    alt="Media buyer headshot"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body-sm text-body-sm font-medium">
                      Mike Chen (Ads)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      18 Tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary/80 h-2 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bar 3 */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  <img
                    alt="SEO specialist headshot"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body-sm text-body-sm font-medium">
                      Elena Rodriguez (SEO)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      32 Tasks (Overloaded)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: "95%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bar 4 */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  <img
                    alt="Copywriter headshot"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body-sm text-body-sm font-medium">
                      David Kim (Copy)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      12 Tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary/50 h-2 rounded-full"
                      style={{ width: "40%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leads in Pipeline */}
          <div className="lg:col-span-5 bg-[#1A1A1A] text-white rounded-lg p-card-padding shadow-[0px_10px_20px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <h2 className="font-title-lg text-title-lg mb-2 text-white/90">
                Leads in Pipeline
              </h2>
              <p className="font-body-sm text-body-sm text-white/60 mb-6">
                Total potential MRR across 14 active deals.
              </p>
              <div className="font-display-lg text-display-lg text-white mb-1">
                $48,500
              </div>
              <div className="font-label-md text-label-md text-emerald-400 flex items-center">
                <span className="material-symbols-outlined text-sm mr-1">
                  arrow_upward
                </span>{" "}
                12% vs last month
              </div>
            </div>
            <div className="mt-8 space-y-3 relative z-10">
              <div className="bg-white/10 p-3 rounded-md flex justify-between items-center backdrop-blur-sm border border-white/5">
                <div>
                  <div className="font-label-md text-label-md text-white">
                    Acme Corp Redesign
                  </div>
                  <div className="font-label-sm text-label-sm text-white/50">
                    Proposal Sent
                  </div>
                </div>
                <div className="font-body-sm text-body-sm font-medium">
                  $12k/mo
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-md flex justify-between items-center backdrop-blur-sm border border-white/5">
                <div>
                  <div className="font-label-md text-label-md text-white">
                    TechFlow Ads Retainer
                  </div>
                  <div className="font-label-sm text-label-sm text-white/50">
                    Negotiation
                  </div>
                </div>
                <div className="font-body-sm text-body-sm font-medium">
                  $8.5k/mo
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: TASKS & CLIENT HEALTH */}
          {/* Tasks Due Today */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F0F0F0]">
              <h2 className="font-title-lg text-title-lg text-on-surface">
                Tasks Due Today
              </h2>
              <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2 py-1 rounded-full">
                5 Left
              </span>
            </div>
            <ul className="space-y-3 flex-1 overflow-y-auto">
              <li className="flex items-start group">
                <input
                  className="mt-1 mr-3 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                />
                <div>
                  <p className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                    Review Q3 Reports for Zenith
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Assigned to You • Due 2:00 PM
                  </p>
                </div>
              </li>
              <li className="flex items-start group">
                <input
                  className="mt-1 mr-3 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                />
                <div>
                  <p className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                    Approve Ad Spend Increase
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Assigned to Mike Chen • Due 4:30 PM
                  </p>
                </div>
              </li>
              <li className="flex items-start group">
                <input
                  className="mt-1 mr-3 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                />
                <div>
                  <p className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                    Onboarding Call: Nova Brands
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Assigned to You • Due 11:00 AM
                  </p>
                </div>
              </li>
              <li className="flex items-start group">
                <input
                  className="mt-1 mr-3 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                />
                <div>
                  <p className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                    Finalize Pitch Deck
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Assigned to Sarah J. • Due 5:00 PM
                  </p>
                </div>
              </li>
            </ul>
            <button className="mt-4 w-full py-2 bg-transparent text-primary border border-primary/20 rounded-md font-label-md text-label-md hover:bg-primary/5 transition-colors">
              View All Tasks
            </button>
          </div>

          {/* Client Health Score */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-[#E5E5E7] p-0 shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
            <div className="p-card-padding flex justify-between items-center bg-white border-b border-[#F0F0F0]">
              <h2 className="font-title-lg text-title-lg text-on-surface">
                Client Health Score
              </h2>
              <div className="relative">
                <select className="bg-gray-50 border border-[#E5E5E7] text-sm rounded-md focus:ring-primary focus:border-primary block w-full p-2 font-label-sm text-label-sm">
                  <option>Sort by: Risk Level</option>
                  <option>Sort by: MRR</option>
                  <option>Sort by: Name</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                    <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                      Client
                    </th>
                    <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                      Service
                    </th>
                    <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                      MRR
                    </th>
                    <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                      Health
                    </th>
                    <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  <tr className="hover:bg-[#F9F9F9] transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="font-body-sm text-body-sm font-medium text-on-surface">
                        Stark Industries
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        Since Jan 2022
                      </div>
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                      Full Service
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm font-medium">
                      $15,000
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
                        Excellent
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F9F9F9] transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="font-body-sm text-body-sm font-medium text-on-surface">
                        Wayne Enterprises
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        Since Mar 2023
                      </div>
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                      Meta Ads
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm font-medium">
                      $4,500
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-amber-50 text-amber-700 border border-amber-100">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>{" "}
                        Needs Attn
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F9F9F9] transition-colors cursor-pointer bg-red-50/30">
                    <td className="py-3 px-4">
                      <div className="font-body-sm text-body-sm font-medium text-on-surface">
                        Oscorp
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        Since Oct 2023
                      </div>
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                      SEO & Content
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm font-medium">
                      $3,200
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-red-50 text-red-700 border border-red-100">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>{" "}
                        At Risk
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F9F9F9] transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="font-body-sm text-body-sm font-medium text-on-surface">
                        Globex Corp
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        Since Feb 2024
                      </div>
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                      Design Retainer
                    </td>
                    <td className="py-3 px-4 font-body-sm text-body-sm font-medium">
                      $2,000
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
                        Good
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
