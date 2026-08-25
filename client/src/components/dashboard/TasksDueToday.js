"use client";

import React from "react";

export default function TasksDueToday() {
  const tasks = [
    {
      title: "Review Q3 Reports for Zenith",
      assigned: "You",
      dueTime: "2:00 PM",
      dueDate: "Today"
    },
    {
      title: "Approve Ad Spend Increase",
      assigned: "Mike Chen",
      dueTime: "4:30 PM",
      dueDate: "Today"
    },
    {
      title: "Onboarding Call: Nova Brands",
      assigned: "You",
      dueTime: "11:00 AM",
      dueDate: "Today"
    },
    {
      title: "Finalize Pitch Deck",
      assigned: "Sarah J.",
      dueTime: "5:00 PM",
      dueDate: "Today"
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F0F0F0]">
        <h2 className="font-title-lg text-title-lg text-on-surface">
          Tasks Due Today
        </h2>
        <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2 py-1 rounded-full">
          5 Left
        </span>
      </div>
      <ul className="space-y-3 flex-1 overflow-y-auto">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-start group">
            <input
              className="mt-1 mr-3 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              type="checkbox"
            />
            <div>
              <p className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                {task.title}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Assigned to {task.assigned} • Due {task.dueTime}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-4 w-full py-2 bg-transparent text-primary border border-primary/20 rounded-md font-label-md text-label-md hover:bg-primary/5 transition-colors">
        View All Tasks
      </button>
    </div>
  );
}
