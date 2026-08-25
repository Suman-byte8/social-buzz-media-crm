"use client";

import React from "react";

export default function MetricsGrid() {
  const metrics = [
    { title: "Active Clients", value: "42", change: "+3 this mo", changeType: "positive", icon: "domain" },
    { title: "MRR", value: "$128k", change: "12%", changeType: "positive", icon: "payments" },
    { title: "Out. Invoices", value: "$24.5k", change: "4 Overdue", changeType: "negative", icon: "receipt_long" },
    { title: "Active Google Ads", value: "156", change: "All Healthy", icon: "ads_click" },
    { title: "Active Meta Camp.", value: "89", change: "$12k/day spend", icon: "campaign" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-stack-sm md:gap-stack-md">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            {metric.title}
          </span>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-on-surface">
              {metric.value}
            </span>
            <span className="material-symbols-outlined text-primary/50">
              {metric.icon}
            </span>
          </div>
          {metric.change && (
            <span className={`font-label-sm text-label-sm mt-2 ${metric.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
              {metric.change}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
