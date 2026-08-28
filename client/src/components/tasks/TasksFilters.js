"use client";

import React from "react";

export default function TasksFilters({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  clientFilter,
  onClientChange,
  assigneeFilter,
  onAssigneeChange,
  monthFilter,
  onMonthChange,
  clients,
  teamMembers,
}) {
  const selectClass =
    "appearance-none bg-gray-50 border border-outline-variant text-on-surface rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none";

  return (
    <div className="bg-white rounded-lg border border-outline-variant shadow-card p-4 mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
          search
        </span>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        />
      </div>

      <div className="relative">
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
          <option value="all">All Statuses</option>
          <option value="todo">Backlog</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">
          expand_more
        </span>
      </div>

      <div className="relative">
        <select value={priorityFilter} onChange={(e) => onPriorityChange(e.target.value)} className={selectClass}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">
          expand_more
        </span>
      </div>

      <div className="relative">
        <select value={clientFilter} onChange={(e) => onClientChange(e.target.value)} className={selectClass}>
          <option value="all">All Clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">
          expand_more
        </span>
      </div>

      <div className="relative">
        <select value={assigneeFilter} onChange={(e) => onAssigneeChange(e.target.value)} className={selectClass}>
          <option value="all">All Assignees</option>
          {(teamMembers || []).map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">
          expand_more
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-gray-50 border border-outline-variant text-on-surface rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        />
        {monthFilter && (
          <button
            type="button"
            onClick={() => onMonthChange("")}
            title="Clear month filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
