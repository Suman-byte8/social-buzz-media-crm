"use client";

import React from "react";
import ProposalTab from "@/components/clients/ProposalTab";
import Overview from "@/components/clients/Overview";
import Credentials from "@/components/clients/Credentials";
import AdsTab from "@/components/clients/AdsTab";
import MetaAdsTab from "@/components/clients/MetaAdsTab";
import SocialMedia from "@/components/clients/SocialMedia";
import Reports from "@/components/clients/Reports";
import Invoices from "@/components/clients/Invoices";
import Notes from "@/components/clients/Notes";
import Renewal from "@/components/clients/Renewal";

const tabs = [
  { id: "overview", label: "Overview", icon: "grid_view" },
  { id: "proposal", label: "Proposal", icon: "description" },
  // { id: "agreement", label: "Agreement", icon: "handshake" },
  // { id: "nda", label: "NDA", icon: "lock" },
  // { id: "brand_assets", label: "Brand Assets", icon: "photo_library" },
  { id: "credentials", label: "Credentials", icon: "key" },
  { id: "google_ads", label: "Google Ads", icon: "ads_click" },
  { id: "meta_ads", label: "Meta Ads", icon: "campaign" },
  { id: "social", label: "Social", icon: "thumb_up" },
  { id: "reports", label: "Reports", icon: "bar_chart" },
  { id: "invoices", label: "Invoices", icon: "receipt_long" },
  { id: "notes", label: "Notes", icon: "event_note" },
  { id: "renewal", label: "Renewal", icon: "autorenew" },
];

export default function ClientDetailContent({ activeTab, setActiveTab }) {
  return (
    <main className="flex-1 p-container-margin flex flex-col gap-stack-lg max-w-[1600px] w-full mx-auto">
      {/* Client Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md bg-surface p-card-padding rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-stack-md">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-surface-variant bg-white flex items-center justify-center shrink-0 shadow-sm">
            <img
              alt="Client Logo"
              className="w-full h-full object-contain p-2"
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="font-headline-md text-headline-md text-on-surface m-0">
                NovaTech Innovations
              </h1>
              <span className="bg-primary-container/10 text-primary border border-primary-container/20 px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Active Client
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[16px]">
                domain
              </span>
              Enterprise SaaS &amp; Cloud Infrastructure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              add_task
            </span>
            Log Note
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              rocket_launch
            </span>
            New Campaign
          </button>
        </div>
      </div>

      {/* Workspace Tabbed Navigation */}
      <div className="border-b border-outline-variant w-full bg-surface-container-lowest py-1 px-1">
        <nav
          aria-label="Tabs"
          className="flex flex-wrap items-center gap-1 text-xs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab?.(tab.id)}
              className={`py-1.5 px-2.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-variant/40"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === "proposal" ? (
        <ProposalTab />
      ) : activeTab === "overview" ? (
        <Overview />
      ) : activeTab === "credentials" ? (
        <Credentials />
      ) : activeTab === "google_ads" ? (
        <AdsTab />
      ) : activeTab === "meta_ads" ? (
        <MetaAdsTab />
      ) : activeTab === "social" ? (
        <SocialMedia />
      ) : activeTab === "reports" ? (
        <Reports />
      ) : activeTab === "invoices" ? (
        <Invoices />
      ) : activeTab === "notes" ? (
        <Notes />
      ) : activeTab === "renewal" ? (
        <Renewal />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-lg">
          {/* Company Details Card */}
          <div className="md:col-span-8 bg-surface rounded-xl shadow-sm border border-outline-variant p-card-padding flex flex-col gap-stack-md h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-bl-full -z-0"></div>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  business
                </span>
                Company Details
              </h3>
              <button className="text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  edit
                </span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-2 relative z-10">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Primary Contact
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface font-medium">
                      Sarah Jenkins
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary">
                      VP of Marketing
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Contact Info
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  <a
                    className="font-body-sm text-body-sm text-on-surface hover:text-primary transition-colors flex items-center gap-2"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      mail
                    </span>
                    sarah.j@novatech.io
                  </a>
                  <a
                    className="font-body-sm text-body-sm text-on-surface hover:text-primary transition-colors flex items-center gap-2"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      call
                    </span>
                    +1 (555) 019-2837
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Web &amp; Location
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  <a
                    className="font-body-sm text-body-sm text-on-surface hover:text-primary transition-colors flex items-center gap-2"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      language
                    </span>
                    www.novatech.io
                  </a>
                  <span className="font-body-sm text-body-sm text-on-surface flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">
                      location_on
                    </span>
                    <span>
                      100 Innovation Way
                      <br />
                      San Francisco, CA 94105
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Key Details
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center border-b border-surface-variant pb-1">
                    <span className="font-body-sm text-body-sm text-secondary">
                      Client Since
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">
                      Oct 2022
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-surface-variant pb-1">
                    <span className="font-body-sm text-body-sm text-secondary">
                      Billing Cycle
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">
                      Net 30 (1st)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body-sm text-body-sm text-secondary">
                      Timezone
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">
                      PST / PDT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Budget Card */}
          <div className="md:col-span-4 bg-primary text-white rounded-xl shadow-sm p-card-padding flex flex-col justify-between h-full relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "16px 16px",
              }}
            ></div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-white/80 uppercase tracking-widest">
                  Monthly Retainer
                </span>
                <h3 className="font-display-lg text-display-lg font-bold mt-1">
                  $24,500
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-white">
                  payments
                </span>
              </div>
            </div>
            <div className="relative z-10 mt-6 flex flex-col gap-3">
              <div className="flex justify-between items-center text-white/90">
                <span className="font-body-sm text-body-sm">
                  Media Spend Managed
                </span>
                <span className="font-body-md text-body-md font-semibold">
                  $150,000/mo
                </span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white w-[75%] h-full rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-label-sm text-white/70">
                  75% Budget Utilized
                </span>
                <span className="font-label-sm text-label-sm text-white flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">
                    trending_up
                  </span>
                  +12% YTD
                </span>
              </div>
            </div>
          </div>

          {/* Current Services List */}
          <div className="md:col-span-8 bg-surface rounded-xl shadow-sm border border-outline-variant p-card-padding flex flex-col gap-stack-md h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  category
                </span>
                Active Services
              </h3>
              <button className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1">
                Manage Scope{" "}
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </button>
            </div>
            <div className="flex flex-col gap-3 mt-2">
              {/* Service Item 1 */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-surface-variant hover:bg-surface-variant/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">
                      drive_file_rename
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
                      Technical SEO &amp; Content Strategy
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Tier 2 Retainer
                    </span>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-label-sm text-label-sm hidden sm:block">
                  Active
                </span>
              </div>
              {/* Service Item 2 */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-surface-variant hover:bg-surface-variant/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-orange-50 text-orange-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">ads_click</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
                      Google Ads Management (PPC)
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      $100k/mo Spend Target
                    </span>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-label-sm text-label-sm hidden sm:block">
                  Active
                </span>
              </div>
              {/* Service Item 3 */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-surface-variant hover:bg-surface-variant/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">campaign</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
                      B2B LinkedIn Campaign
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Q3 Initiative
                    </span>
                  </div>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-label-sm text-label-sm hidden sm:block">
                  Onboarding
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Team Card */}
          <div className="md:col-span-4 bg-surface rounded-xl shadow-sm border border-outline-variant p-card-padding flex flex-col gap-stack-md h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  groups
                </span>
                Agency Team
              </h3>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0 border border-outline-variant">
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    David Chen
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    Account Director
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0 border border-outline-variant">
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Emily Stanton
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">
                    Lead SEO Strategist
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0 border border-outline-variant">
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Marcus Johnson
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">
                    PPC Specialist
                  </span>
                </div>
              </div>
              <button className="mt-2 w-full py-2 border border-dashed border-outline-variant rounded-lg text-secondary font-label-md text-label-md hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface">
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                Assign Member
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
