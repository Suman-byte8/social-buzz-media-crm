import React from "react";
import Card from "@/components/ui/Card";

export default function Overview({ client }) {
  const clientName = client?.name || "Client Details";
  const clientHealth = client?.clientHealth || 0;
  const healthLabel = clientHealth >= 80 ? "Excellent" : clientHealth >= 50 ? "Fair" : "At Risk";
  const services = Array.isArray(client?.servicesSelected) ? client.servicesSelected :
    (client?.servicesSelected ? client.servicesSelected.split(",") : []);

  const daysUntilRenewal = client?.renewal
    ? Math.ceil((new Date(client.renewal) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const metrics = [
    { id: 1, title: "Active Services", value: services.length, change: services.length > 0 ? `${services.length} service${services.length > 1 ? 's' : ''} active` : "No active services" },
    { id: 2, title: "Client Health", value: `${clientHealth}%`, change: `${healthLabel} health score` },
    { id: 3, title: "Client Since", value: (client?.clientSince || client?.createdAt) ? new Date(client.clientSince || client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "N/A", change: "" },
    { id: 4, title: "Next Renewal", value: client?.renewal ? new Date(client.renewal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Not set", change: daysUntilRenewal !== null ? (daysUntilRenewal >= 0 ? `${daysUntilRenewal} days away` : "Overdue") : "" },
  ];

  const recentActivities = client?.notes ? [
    { id: 1, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), message: client.notes.substring(0, 100) + (client.notes.length > 100 ? '...' : ''), type: "Note" },
  ] : [
    { id: 1, date: "N/A", message: "No recent activity recorded", type: "Note" },
  ];

  const keyContacts = [
    { role: "Client Name", name: clientName },
    { role: "Email", name: client?.email || "N/A" },
    { role: "Phone", name: client?.phoneNumber || "N/A" },
    { role: "WhatsApp", name: client?.whatsappNumber || "N/A" },
    { role: "Website", name: client?.website || "N/A" },
  ];

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