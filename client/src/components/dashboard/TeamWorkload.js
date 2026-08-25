"use client";

import React from "react";

export default function TeamWorkload() {
  const teamData = [
    {
      name: "Sarah Jenkins (Design)",
      tasks: 24,
      width: "85%",
      color: "bg-primary",
      status: "good",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    },
    {
      name: "Mike Chen (Ads)",
      tasks: 18,
      width: "65%",
      color: "bg-primary/80",
      status: "good",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      name: "Elena Rodriguez (SEO)",
      tasks: 32,
      width: "95%",
      color: "bg-red-600",
      status: "overloaded",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    },
    {
      name: "David Kim (Copy)",
      tasks: 12,
      width: "40%",
      color: "bg-primary/50",
      status: "low",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-title-lg text-title-lg text-on-surface">
          Team Workload
        </h2>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
      <div className="space-y-4">
        {teamData.map((member, index) => (
          <div key={index} className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
              <img
                alt={`${member.name.split(' ')[0]}'s profile picture`}
                className="w-full h-full object-cover"
                src={member.image}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-body-sm text-body-sm font-medium">
                  {member.name}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {member.tasks} Tasks
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${member.color}`}
                  style={{ width: member.width }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
