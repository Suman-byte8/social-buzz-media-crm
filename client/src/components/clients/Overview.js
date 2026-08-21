import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

export default function Overview({ client }) {
  const clientName = client?.name || "Client Details";
  const clientIndustry = client?.industry || "Industry";
  const clientHealth = client?.clientHealth || 0;
  const healthLabel = clientHealth >= 80 ? "Excellent" : clientHealth >= 50 ? "Fair" : "At Risk";
  const healthColor = clientHealth >= 80 ? "green" : clientHealth >= 50 ? "amber" : "red";
  const services = Array.isArray(client?.servicesSelected) ? client.servicesSelected : 
    (client?.servicesSelected ? client.servicesSelected.split(",") : []);
  const mrr = client?.monthlyRetainer ? `$${client.monthlyRetainer.toLocaleString()}` : "N/A";

  const metrics = [
    { id: 1, title: "Monthly Retainer", value: mrr, change: "Based on current contract" },
    { id: 2, title: "Active Services", value: services.length, change: services.length > 0 ? `${services.length} service${services.length > 1 ? 's' : ''} active` : "No active services" },
    { id: 3, title: "Client Health", value: `${clientHealth}%`, change: `${healthLabel} health score` },
    { id: 4, title: "Client Since", value: client?.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "N/A", change: "" },
  ];

  const recentActivities = client?.notes ? [
    { id: 1, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), message: client.notes.substring(0, 100) + (client.notes.length > 100 ? '...' : ''), type: "Note" },
  ] : [
    { id: 1, date: "N/A", message: "No recent activity recorded", type: "Note" },
  ];

  const keyContacts = [
    { role: "Primary Contact", name: client?.contactPerson || clientName },
    { role: "Email", name: client?.email || "N/A" },
    { role: "Phone", name: client?.phoneNumber || "N/A" },
  ];

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
          {metrics.map((metric) => (
            <Card key={metric.id} className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="font-title-sm text-title-sm text-on-surface-variant mb-3">
                {metric.title}
              </h2>
              <p className="font-headline-sm text-headline-sm text-on-surface">
                {metric.value}
              </p>
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
              <button className="text-primary font-label-sm hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="rounded-3xl bg-surface-container-lowest p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {activity.date}
                      </p>
                      <p className="font-body-md text-body-md text-on-surface font-semibold">
                        {activity.message}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {activity.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-4">Key Contacts</h2>
            <div className="space-y-4">
              {keyContacts.map((contact, idx) => (
                <div key={idx}>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{contact.role}</p>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">
                    {contact.name}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}