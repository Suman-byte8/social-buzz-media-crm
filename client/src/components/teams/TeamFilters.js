"use client";

import React from "react";

const STATUS_OPTIONS = ["All", "active", "inactive", "null"];
const DEPARTMENTS = ["All", "Social Media", "Tech & Dev", "Creative & Design", "Strategy"];

export default function TeamFilters({ searchTerm, onSearchChange, statusFilter, onStatusChange, departmentFilter, onDepartmentChange }) {
  return (
    <div className="bg-white border-b border-[#F0F0F0] p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
      <div className="relative w-full md:w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">search</span>
        <input
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-outline-variant rounded focus:ring-1 focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all"
          placeholder="Search team members..."
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <select
          className="py-2 pl-3 pr-8 bg-gray-50 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:ring-1 focus:ring-primary text-on-surface"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All Status" : option === "null" ? "No Status" : option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
        <select
          className="py-2 pl-3 pr-8 bg-gray-50 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:ring-1 focus:ring-primary text-on-surface"
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
        >
          {DEPARTMENTS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All Departments" : option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
