import React from "react";

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "positive", 
  icon = null,
  description = null
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-[24px] flex flex-col justify-between h-full shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-transform cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">
          {title}
        </span>
        {icon && (
          <span className={`material-symbols-outlined text-primary opacity-80 ${icon && `text-${icon}`}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between mt-4">
        <span className="font-display-lg text-display-lg text-on-surface">
          {value}
        </span>
        <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${changeType === "positive" ? "text-emerald-600 bg-emerald-50" : changeType === "negative" ? "text-amber-700 bg-amber-50" : "text-primary bg-primary/10"} flex items-center`}>
          <span className="material-symbols-outlined text-[14px] mr-1">
            {changeType === "positive" ? "trending_up" : changeType === "negative" ? "trending_down" : "horizontal_rule"}
          </span>{" "}
          {change}
        </span>
      </div>
    </div>
  );
}