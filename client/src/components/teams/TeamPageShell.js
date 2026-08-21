"use client";

import React, { useState, useMemo } from "react";
import { fetchTeamMembers } from "@/services/teamService";
import TeamMemberRow from "@/components/teams/TeamMemberRow";
import AddTeamMemberModal from "@/components/teams/AddTeamMemberModal";
import EditMemberModal from "@/components/teams/EditMemberModal";

const STATUS_OPTIONS = ["All", "active", "inactive", "null"];
const DEPARTMENTS = ["All", "Social Media", "Tech & Dev", "Creative & Design", "Strategy"];

export default function TeamPageShell({ teamMembers: initialMembers }) {
  const [teamMembers, setTeamMembers] = useState(initialMembers || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const itemsPerPage = 10;

  const handleTeamMemberUpdate = async () => {
    try {
      const members = await fetchTeamMembers();
      setTeamMembers(members || []);
      setEditingMember(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error refreshing team members:", error);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Delete ${member.name}? This action cannot be undone.`)) return;
    try {
      const { deleteTeamMember } = await import("@/services/teamService");
      await deleteTeamMember(member.id);
      handleTeamMemberUpdate();
    } catch (error) {
      console.error("Error deleting team member:", error);
      alert("Failed to delete team member. Please try again.");
    }
  };

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        !searchTerm ||
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "null"
          ? !member.status
          : (member.status || "").toLowerCase() === statusFilter);

      const matchesDepartment =
        departmentFilter === "All" ||
        member.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [teamMembers, searchTerm, statusFilter, departmentFilter]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = teamMembers.filter(
    (m) => (m.status || "").toLowerCase() === "active"
  ).length;
  const availableCount = activeCount;

  const statCards = [
    {
      id: 1,
      title: "Total Members",
      value: teamMembers.length.toString(),
      icon: "group",
      iconColor: "text-on-surface-variant",
    },
    {
      id: 2,
      title: "Active Now",
      value: activeCount.toString(),
      icon: "check_circle",
      iconColor: "text-green-600",
    },
    {
      id: 3,
      title: "Available for Work",
      value: availableCount.toString(),
      icon: "person_add",
      iconColor: "text-blue-600",
    },
    {
      id: 4,
      title: "Tasks Completed This Week",
      value: (teamMembers.length * 2).toString(),
      icon: "task_alt",
      iconColor: "text-purple-600",
    },
  ];

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Team</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage agency personnel, workloads, and assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded bg-white border border-[#1A1A1A] text-[#1A1A1A] font-label-md text-label-md flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 rounded bg-[#e8262a] text-white font-label-md text-label-md flex items-center gap-2 hover:bg-[#c00016] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Team Member
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-lg border border-[#E5E5E7] p-5 shadow-[0px_2px_4px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-2 text-on-surface-variant mb-2">
              <span className={`material-symbols-outlined text-[18px] ${stat.iconColor}`}>
                {stat.icon}
              </span>
              <span className="font-label-md text-label-md uppercase tracking-wider">
                {stat.title}
              </span>
            </div>
            <div className="font-display-lg text-display-lg text-on-surface">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-t-lg border border-[#E5E5E7] border-b-0 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#E5E5E7] rounded focus:ring-1 focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all"
            placeholder="Search team members..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="py-2 pl-3 pr-8 bg-gray-50 border border-[#E5E5E7] rounded font-body-sm text-body-sm outline-none focus:ring-1 focus:ring-primary text-on-surface"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All"
                  ? "All Status"
                  : option === "null"
                  ? "No Status"
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="py-2 pl-3 pr-8 bg-gray-50 border border-[#E5E5E7] rounded font-body-sm text-body-sm outline-none focus:ring-1 focus:ring-primary text-on-surface"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            {DEPARTMENTS.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All Departments" : option}
              </option>
            ))}
          </select>
          <button className="p-2 border border-[#E5E5E7] rounded text-on-surface-variant hover:bg-gray-50">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-b-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[25%]">
                  Team Member
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">
                  Status
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[20%]">
                  Current Work
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">
                  Clients Handling
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[15%]">
                  Workload
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider w-[10%] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y divide-[#F0F0F0]">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => (
                  <TeamMemberRow
                    key={member.id}
                    member={member}
                    onUpdate={handleTeamMemberUpdate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-on-surface-variant">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#F0F0F0] flex items-center justify-between bg-white rounded-b-lg">
          <span className="text-xs text-tertiary">
            Showing {filteredMembers.length > 0 ? startIndex + 1 : 0} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredMembers.length)} of{" "}
            {filteredMembers.length} members
          </span>
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded text-tertiary hover:bg-gray-100 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded font-label-sm text-label-sm flex items-center justify-center ${
                  currentPage === page
                    ? "bg-[#e8262a] text-white"
                    : "text-tertiary hover:bg-gray-100"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="p-1 rounded text-tertiary hover:bg-gray-100 disabled:opacity-50"
              disabled={currentPage === totalPages || totalPages <= 1}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTeamMemberUpdate}
      />

      {/* Edit Team Member Modal */}
      {editingMember && (
        <EditMemberModal
          isOpen={true}
          onClose={() => setEditingMember(null)}
          onSuccess={handleTeamMemberUpdate}
          member={editingMember}
        />
      )}
    </div>
  );
}
