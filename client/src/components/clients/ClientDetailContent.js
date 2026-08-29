"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProposalTab from "@/components/clients/ProposalTab";
import Overview from "@/components/clients/Overview";
import Credentials from "@/components/clients/Credentials";
import BrandKit from "@/components/clients/BrandKit";
import AdsTab from "@/components/clients/AdsTab";
import MetaAdsTab from "@/components/clients/MetaAdsTab";
import SocialMedia from "@/components/clients/SocialMedia";
import Reports from "@/components/clients/Reports";
import Invoices from "@/components/clients/Invoices";
import Notes from "@/components/clients/Notes";
import Renewal from "@/components/clients/Renewal";
import ContentCalendarTab from "@/components/clients/ContentCalendarTab";
import AddEditClientModal from "@/components/clients/AddEditClientModal";
import { fetchClientById } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import { getAssetUrl } from "@/services/apiClient";
import { useAuth } from "@/app/login/context/AuthContext";

const tabs = [
  { id: "overview", label: "Overview", icon: "grid_view" },
  { id: "proposal", label: "Proposal", icon: "description", adminOnly: true },
  { id: "credentials", label: "Credentials", icon: "key" },
  { id: "brand_kit", label: "Brand Kit", icon: "palette" },
  { id: "google_ads", label: "Google Ads", icon: "ads_click" },
  { id: "meta_ads", label: "Meta Ads", icon: "campaign" },
  { id: "social", label: "Social", icon: "thumb_up" },
  { id: "reports", label: "Reports", icon: "bar_chart" },
  { id: "invoices", label: "Invoices", icon: "receipt_long", adminOnly: true },
  { id: "notes", label: "Notes", icon: "event_note" },
  { id: "renewal", label: "Renewal", icon: "autorenew" },
  { id: "content_calendar", label: "Content Calendar", icon: "calendar_today" },
];

export default function ClientDetailContent({ activeTab, setActiveTab, client = {}, clientId }) {
  const dispatch = useDispatch();
  const teamMembers = useSelector((state) => state.team.teamMembers);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { isAdmin } = useAuth();
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  useEffect(() => {
    if (teamMembers.length === 0) {
      dispatch(fetchTeamMembers());
    }
  }, [dispatch, teamMembers.length]);

  const clientName = client.name || "Client Details";
  const clientIndustry = client.industry || "Industry";
  const clientHealth = client.clientHealth ?? 0;
  const healthLabel = clientHealth >= 80 ? "Excellent" : clientHealth >= 50 ? "Fair" : "At Risk";
  const healthColor = clientHealth >= 80 ? "green" : clientHealth >= 50 ? "amber" : "red";

  const clientSinceDate = client.clientSince || client.createdAt;
  const daysAsClient = clientSinceDate
    ? Math.max(0, Math.floor((new Date() - new Date(clientSinceDate)) / (1000 * 60 * 60 * 24)))
    : null;
  const clientSinceLabel = clientSinceDate
    ? new Date(clientSinceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    dispatch(fetchClientById(clientId));
  };

  return (
    <main className="flex-1 p-container-margin flex flex-col gap-stack-lg max-w-[1600px] w-full mx-auto">
      {/* Client Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md bg-surface p-card-padding rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-stack-md">
          <div
            className={`w-28 h-28 rounded-xl flex items-center justify-center shrink-0 ${
              client.logo ? "" : "border border-surface-variant bg-primary-container shadow-sm"
            }`}
          >
            {client.logo ? (
              <img src={getAssetUrl(client.logo)} alt={clientName} className="w-full h-full object-contain" />
            ) : (
              <span className="font-display-md text-display-md text-primary font-bold">
                {clientName[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3 flex-wrap">
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
              {daysAsClient !== null && (
                <span
                  title={`Client since ${clientSinceLabel}`}
                  className="px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <span className="material-symbols-outlined text-[16px]">event_available</span>
                  Client since {daysAsClient.toLocaleString()} days
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1.5 m-0">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                {clientIndustry}
              </p>
              {client.email && (
                <a href={`mailto:${client.email}`} className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  {client.email}
                </a>
              )}
              {client.phoneNumber && (
                <a href={`tel:${client.phoneNumber}`} className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  {client.phoneNumber}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab?.("notes")}
            className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            Log Note
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Client
          </button>
        </div>
      </div>

      {/* Workspace Tabbed Navigation */}
      <div className="border-b border-outline-variant w-full bg-surface-container-lowest py-1 px-1">
        <nav
          aria-label="Tabs"
          className="flex flex-wrap items-center gap-1 text-xs"
        >
          {visibleTabs.map((tab) => (
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
      {activeTab === "proposal" && isAdmin ? (
        <ProposalTab client={client} clientId={clientId} />
      ) : activeTab === "credentials" ? (
        <Credentials client={client} clientId={clientId} />
      ) : activeTab === "brand_kit" ? (
        <BrandKit client={client} clientId={clientId} />
      ) : activeTab === "google_ads" ? (
        <AdsTab client={client} />
      ) : activeTab === "meta_ads" ? (
        <MetaAdsTab client={client} />
      ) : activeTab === "social" ? (
        <SocialMedia client={client} />
      ) : activeTab === "reports" ? (
        <Reports client={client} />
      ) : activeTab === "invoices" && isAdmin ? (
        <Invoices client={client} clientId={clientId} />
      ) : activeTab === "notes" ? (
        <Notes client={client} clientId={clientId} />
      ) : activeTab === "renewal" ? (
        <Renewal client={client} />
      ) : activeTab === "content_calendar" ? (
        <ContentCalendarTab clientId={clientId} client={client} />
      ) : (
        <Overview client={client} />
      )}

      <AddEditClientModal
        isOpen={editModalOpen}
        client={client}
        teamMembers={teamMembers}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </main>
  );
}
