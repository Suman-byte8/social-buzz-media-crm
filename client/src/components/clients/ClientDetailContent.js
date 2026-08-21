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

export default function ClientDetailContent({ activeTab, setActiveTab, client = {}, clientId }) {
  const clientName = client.name || "Client Details";
  const clientIndustry = client.industry || "Industry";
  const clientHealth = client.clientHealth;
  const healthLabel = clientHealth >= 80 ? "Excellent" : clientHealth >= 50 ? "Fair" : "At Risk";
  const healthColor = clientHealth >= 80 ? "green" : clientHealth >= 50 ? "amber" : "red";
  const services = Array.isArray(client.servicesSelected) ? client.servicesSelected : (client.servicesSelected ? client.servicesSelected.split(",") : []);
  const credentials = client.credentials && typeof client.credentials === "object" ? client.credentials : (client.credentials ? JSON.parse(client.credentials) : {});

  return (
    <main className="flex-1 p-container-margin flex flex-col gap-stack-lg max-w-[1600px] w-full mx-auto">
      {/* Client Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md bg-surface p-card-padding rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-stack-md">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-surface-variant bg-primary-container flex items-center justify-center shrink-0 shadow-sm">
            <span className="font-display-md text-display-md text-primary font-bold">
              {clientName[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="font-headline-md text-headline-md text-on-surface m-0">
                {clientName}
              </h1>
              <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                healthColor === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
                healthColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  healthColor === 'green' ? 'bg-green-500' :
                  healthColor === 'amber' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}></span>
                {healthLabel} Client
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[16px]">
                domain
              </span>
              {clientIndustry}
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
        <ProposalTab client={client} />
      ) : activeTab === "overview" ? (
        <Overview client={client} />
      ) : activeTab === "credentials" ? (
        <Credentials client={client} credentials={credentials} />
      ) : activeTab === "google_ads" ? (
        <AdsTab client={client} />
      ) : activeTab === "meta_ads" ? (
        <MetaAdsTab client={client} />
      ) : activeTab === "social" ? (
        <SocialMedia client={client} />
      ) : activeTab === "reports" ? (
        <Reports client={client} />
      ) : activeTab === "invoices" ? (
        <Invoices client={client} />
      ) : activeTab === "notes" ? (
        <Notes client={client} />
      ) : activeTab === "renewal" ? (
        <Renewal client={client} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-lg">
          {/* Company Details Card */}
          <div className="md:col-span-12 bg-surface rounded-xl shadow-sm border border-outline-variant p-card-padding flex flex-col gap-stack-md h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-bl-full -z-0"></div>
<div className="flex items-center justify-between relative z-10">
                <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    business
                  </span>
                  Company Details
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                    healthColor === 'green' ? 'bg-green-50 text-green-700' :
                    healthColor === 'amber' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      healthColor === 'green' ? 'bg-green-500' :
                      healthColor === 'amber' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}></span>
                    Health: {healthLabel}
                  </span>
                  <button className="text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      edit
                    </span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-2 relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                    Primary Contact
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0">
                      <div className="w-full h-full bg-primary-container rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold material-symbols-outlined text-[20px]">
                          person
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md text-on-surface font-medium">
                        {clientName}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {clientIndustry}
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
                    {client.email || "client@example.com"}
                  </a>
                  <a
                    className="font-body-sm text-body-sm text-on-surface hover:text-primary transition-colors flex items-center gap-2"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      call
                    </span>
                    {client.phoneNumber || "+1 (555) 019-2837"}
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Web &amp; Location
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  {client.address && (
                    <span className="font-body-sm text-body-sm text-on-surface flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">
                        location_on
                      </span>
                      <span>{client.address}</span>
                    </span>
                  )}
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
                      {client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Services List */}
          <div className="md:col-span-12 bg-surface rounded-xl shadow-sm border border-outline-variant p-card-padding flex flex-col gap-stack-md h-full">
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
              {services.length > 0 ? (
                services.map((service, si) => {
                  const palettes = [
                    { bg: "bg-blue-50", text: "text-blue-600", icon: "drive_file_rename" },
                    { bg: "bg-orange-50", text: "text-orange-600", icon: "ads_click" },
                    { bg: "bg-purple-50", text: "text-purple-600", icon: "campaign" },
                    { bg: "bg-green-50", text: "text-green-600", icon: "check_circle" },
                    { bg: "bg-pink-50", text: "text-pink-600", icon: "favorite" },
                    { bg: "bg-cyan-50", text: "text-cyan-600", icon: "insights" },
                  ];
                  const palette = palettes[si % palettes.length];
                  return (
                    <div
                      key={si}
                      className="flex items-center justify-between p-3 rounded-lg border border-surface-variant hover:bg-surface-variant/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded ${palette.bg} ${palette.text} flex items-center justify-center`}>
                          <span className="material-symbols-outlined">{palette.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
                            {service}
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary">
                            Service {si + 1}
                          </span>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-label-sm text-label-sm hidden sm:block">
                        Active
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-outline-variant text-secondary font-body-sm text-body-sm text-center">
                  No active services selected for this client yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
