import React from "react";

export default function StatusBadge({ status, color = "primary", showDot = false }) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    primary: "bg-primary/10 text-primary border-primary/20",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const dotColorMap = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    primary: "bg-primary",
    gray: "bg-gray-400",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  const colorClass = colorMap[color] || colorMap.primary;
  const dotColorClass = dotColorMap[color] || dotColorMap.primary;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm border ${colorClass}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColorClass}`} />}
      {status}
    </span>
  );
}