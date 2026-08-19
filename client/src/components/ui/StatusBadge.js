import React from "react";

export default function StatusBadge({ status, color = "primary" }) {
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

  const colorClass = colorMap[color] || colorMap.primary;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm border ${colorClass}`}>
      {status}
    </span>
  );
}