"use client";

import React from "react";

export default function ClientHealthScore() {
  const clients = [
    {
      name: "Stark Industries",
      since: "Jan 2022",
      service: "Full Service",
      mrr: "$15,000",
      health: { status: "Excellent", color: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-100", dotColor: "bg-emerald-500" }
    },
    {
      name: "Wayne Enterprises",
      since: "Mar 2023",
      service: "Meta Ads",
      mrr: "$4,500",
      health: { status: "Needs Attn", color: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-100", dotColor: "bg-amber-500" }
    },
    {
      name: "Oscorp",
      since: "Oct 2023",
      service: "SEO & Content",
      mrr: "$3,200",
      health: { status: "At Risk", color: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-100", dotColor: "bg-red-500" }
    },
    {
      name: "Globex Corp",
      since: "Feb 2024",
      service: "Design Retainer",
      mrr: "$2,000",
      health: { status: "Good", color: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-100", dotColor: "bg-emerald-500" }
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-0 shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
      <div className="p-card-padding flex justify-between items-center bg-white border-b border-[#F0F0F0]">
        <h2 className="font-title-lg text-title-lg text-on-surface">
          Client Health Score
        </h2>
        <div className="relative">
          <select className="bg-gray-50 border border-[#E5E5E7] text-sm rounded-md focus:ring-primary focus:border-primary block w-full p-2 font-label-sm text-label-sm">
            <option>Sort by: Risk Level</option>
            <option>Sort by: MRR</option>
            <option>Sort by: Name</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
              <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                Client
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                Service
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                MRR
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                Health
              </th>
              <th className="py-3 px-4 font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {clients.map((client) => (
              <tr key={client.name}>
                <td className="py-3 px-4">
                  <div className="font-body-sm text-body-sm font-medium text-on-surface">
                    {client.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    Since {client.since}
                  </div>
                </td>
                <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                  {client.service}
                </td>
                <td className="py-3 px-4 font-body-sm text-body-sm font-medium">
                  {client.mrr}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${client.health.color} ${client.health.textColor} border ${client.health.borderColor}`}>
                    <span className={`w-2 h-2 rounded-full ${client.health.dotColor} mr-1.5`}></span> {client.health.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}