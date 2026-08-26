"use client";

import React from "react";

export default function MetricsGrid({ metrics = [], loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-stack-sm md:gap-stack-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] h-[104px] animate-pulse" />
        ))}
      </div>
    );
  }

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
            <span className={`font-label-sm text-label-sm mt-2 ${metric.changeType === "positive" ? "text-emerald-600" : metric.changeType === "negative" ? "text-amber-700" : "text-on-surface-variant"}`}>
              {metric.change}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
