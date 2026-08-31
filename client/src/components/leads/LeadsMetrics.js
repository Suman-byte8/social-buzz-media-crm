"use client";

import React from "react";

export default function LeadsMetrics({ metrics, loading }) {
  const cards = [
    {
      id: "total",
      title: "Total Leads",
      value: metrics.totalLeads,
      icon: "group",
      iconBg: "bg-surface-container-high",
      iconColor: "text-primary",
      badge: `${metrics.newThisMonth} new this month`,
      badgeClass: "bg-green-50 text-green-700",
    },
    {
      id: "hot",
      title: "Hot Prospects",
      value: metrics.hotProspects,
      icon: "local_fire_department",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      badge: "Needs attention",
      badgeClass: "bg-red-50 text-red-700",
    },
    {
      id: "followup",
      title: "Follow-up Required",
      value: metrics.followUpDue,
      icon: "notifications_active",
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      badge: "Due today or overdue",
      badgeClass: "bg-yellow-50 text-yellow-700",
    },
    {
      id: "lost",
      title: "Lost (This Month)",
      value: metrics.lostThisMonth,
      icon: "sentiment_dissatisfied",
      iconBg: "bg-surface-container-high",
      iconColor: "text-secondary",
      badge: "This month",
      badgeClass: "bg-gray-100 text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-surface-container-lowest rounded-xl p-card-padding border border-outline-variant/50 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {card.icon}
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display-lg text-display-lg text-on-background">
              {loading ? "—" : card.value}
            </span>
            <span className={`font-label-md text-label-md flex items-center px-2 py-1 rounded-full mb-1 ${card.badgeClass}`}>
              {card.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
