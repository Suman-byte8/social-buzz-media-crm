import React, { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

export default function Overview() {
  const [clients] = useState([
    {
      id: 1,
      name: "TechCorp Inc.",
      industry: "SaaS / Enterprise",
      services: ["SEO", "Content"],
      accountManager: "Jane Doe",
      healthStatus: "Excellent",
      healthColor: "green",
      mrr: "$12,500",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      name: "Global Retailers",
      industry: "E-commerce",
      services: ["Meta Ads", "Google Ads", "Design"],
      accountManager: "Mike Smith",
      healthStatus: "Fair",
      healthColor: "amber",
      mrr: "$8,200",
      avatar: null,
    },
    {
      id: 3,
      name: "HealthPlus",
      industry: "Healthcare",
      services: ["SEO"],
      accountManager: "Jane Doe",
      healthStatus: "At Risk",
      healthColor: "red",
      mrr: "$4,500",
      avatar: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80",
    },
  ]);

  const metrics = [
    { id: 1, title: "Monthly Retainer", value: "$12,500", change: "Stable over last 30 days" },
    { id: 2, title: "Active Campaigns", value: "8", change: "2 launching this week" },
    { id: 3, title: "Total Spend", value: "$71,400", change: "+9.8% vs prior period" },
    { id: 4, title: "Open Issues", value: "3", change: "1 overdue deliverable" },
  ];

  const recentActivities = [
    {
      id: 1,
      date: "Oct 24, 2024",
      message: "Approved new Meta Ads budget for Q4 launch",
      type: "Budget",
    },
    {
      id: 2,
      date: "Oct 18, 2024",
      message: "Shared performance deck for September campaigns",
      type: "Report",
    },
    {
      id: 3,
      date: "Oct 12, 2024",
      message: "Reviewed social media strategy with client team",
      type: "Strategy",
    },
  ];

  const keyContacts = [
    { role: "Primary Decision Maker", name: "Sarah Jenkins" },
    { role: "Finance Lead", name: "Miles Carter" },
    { role: "Media Lead", name: "Leah Kim" },
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