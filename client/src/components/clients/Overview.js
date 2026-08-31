"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { fetchMeetingNotes } from "@/redux/slices/meetingNotesSlice";

const meetingTypeLabels = {
  client_sync: "Client Sync",
  internal_sync: "Internal Sync",
  other: "Other",
};

const meetingTypeColors = {
  client_sync: "blue",
  internal_sync: "purple",
  other: "gray",
};

const initialsFor = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

export default function Overview({ client, clientId, teamMembers = [] }) {
  const dispatch = useDispatch();
  const { meetingNotes, loading: loadingNotes } = useSelector((state) => state.meetingNotes);

  useEffect(() => {
    if (clientId) {
      dispatch(fetchMeetingNotes(clientId));
    }
  }, [dispatch, clientId]);

  const clientName = client?.name || "Client Details";
  const clientHealth = client?.clientHealth ?? 0;
  const healthLabel = clientHealth >= 80 ? "Excellent" : clientHealth >= 50 ? "Fair" : "At Risk";
  const healthColor = clientHealth >= 80 ? "green" : clientHealth >= 50 ? "amber" : "red";
  const healthBarColor = clientHealth >= 80 ? "bg-emerald-500" : clientHealth >= 50 ? "bg-amber-500" : "bg-red-500";

  const services = Array.isArray(client?.servicesSelected)
    ? client.servicesSelected
    : (client?.servicesSelected ? client.servicesSelected.split(",") : []);
  const serviceList = services.map((s) => s.trim()).filter(Boolean);

  const accountManager = useMemo(
    () => teamMembers.find((m) => String(m.id) === String(client?.clientManagedBy)) || null,
    [teamMembers, client?.clientManagedBy]
  );

  const daysUntilRenewal = client?.renewal
    ? Math.ceil((new Date(client.renewal) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const metrics = [
    {
      id: 1,
      title: "Client Health",
      value: `${clientHealth}%`,
      change: `${healthLabel} health score`,
      progress: clientHealth,
    },
    {
      id: 2,
      title: "Active Services",
      value: serviceList.length,
      change: serviceList.length > 0 ? `${serviceList.length} service${serviceList.length > 1 ? "s" : ""} active` : "No active services",
    },
    {
      id: 3,
      title: "Client Since",
      value: client?.createdAt ? new Date(client.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
      change: "",
    },
    {
      id: 4,
      title: "Next Renewal",
      value: client?.renewal ? new Date(client.renewal).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set",
      change: daysUntilRenewal !== null ? (daysUntilRenewal >= 0 ? `${daysUntilRenewal} days away` : "Overdue") : "",
    },
  ];

  const recentActivities = useMemo(() => {
    return [...meetingNotes]
      .sort((a, b) => new Date(b.meetingDate || b.createdAt) - new Date(a.meetingDate || a.createdAt))
      .slice(0, 5);
  }, [meetingNotes]);

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Client Overview</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              High-level client summary, account health, and recent activity.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <Card key={metric.id} className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="font-title-sm text-title-sm text-on-surface-variant mb-3">
                {metric.title}
              </h2>
              <p className="font-headline-sm text-headline-sm text-on-surface">
                {metric.value}
              </p>
              {metric.progress !== undefined && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={`h-full rounded-full ${healthBarColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, metric.progress))}%` }}
                  />
                </div>
              )}
              <span className="mt-3 inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                {metric.change}
              </span>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface">Recent Activity</h2>
              <StatusBadge status={healthLabel} color={healthColor} showDot />
            </div>
            {loadingNotes ? (
              <div className="py-8 text-center text-on-surface-variant">
                <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="rounded-3xl bg-surface-container-lowest p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-body-md text-body-md text-on-surface font-semibold truncate">
                            {activity.title}
                          </p>
                          <StatusBadge
                            status={meetingTypeLabels[activity.meetingType] || activity.meetingType}
                            color={meetingTypeColors[activity.meetingType] || "gray"}
                          />
                        </div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                          {activity.meetingDate
                            ? new Date(activity.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "No date"}
                        </p>
                        {activity.description && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-2 block">event_note</span>
                <p className="font-body-sm text-body-sm">No meeting notes recorded yet.</p>
              </div>
            )}
          </Card>

          <Card className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-4">Client Profile</h2>

            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-outline-variant">
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                {accountManager?.avatar ? (
                  <img className="w-full h-full object-cover" src={accountManager.avatar} alt={accountManager.name} />
                ) : (
                  initialsFor(accountManager?.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Account Manager</p>
                {accountManager ? (
                  <>
                    <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{accountManager.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {accountManager.designation || accountManager.department || "Team Member"}
                    </p>
                  </>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant">Unassigned</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pb-4 mb-4 border-b border-outline-variant">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Industry</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{client?.industry || "N/A"}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Address</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{client?.address || "N/A"}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-1.5">Services</p>
                {serviceList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {serviceList.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant">No services selected</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>
                <div className="min-w-0">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Email</p>
                  <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">{client?.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">call</span>
                <div className="min-w-0">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Phone</p>
                  <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">{client?.phoneNumber || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chat</span>
                <div className="min-w-0">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">WhatsApp</p>
                  <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">{client?.whatsappNumber || "N/A"}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
