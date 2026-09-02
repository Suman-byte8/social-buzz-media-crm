"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeamMembers, deleteTeamMember } from "@/redux/slices/teamSlice";
import { fetchTasks } from "@/redux/slices/tasksSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { parseArrayField } from "@/services/teamService";
import TeamToolbar from "@/components/teams/TeamToolbar";
import TeamStats from "@/components/teams/TeamStats";
import TeamFilters from "@/components/teams/TeamFilters";
import TeamTable from "@/components/teams/TeamTable";
import TeamPagination from "@/components/teams/TeamPagination";
import AddTeamMemberModal from "@/components/teams/AddTeamMemberModal";
import EditMemberModal from "@/components/teams/EditMemberModal";

const ITEMS_PER_PAGE = 10;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function TeamPageShell() {
  const dispatch = useDispatch();
  const teamMembers = useSelector((state) => state.team.teamMembers);
  const tasks = useSelector((state) => state.tasks.tasks);
  const clients = useSelector((state) => state.clients.clients);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Always fetch fresh data client-side on mount — this app is a fully
  // static export, so build-time SSR data would otherwise go stale.
  useEffect(() => {
    dispatch(fetchTeamMembers());
    dispatch(fetchTasks({ limit: 500 }));
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  const handleTeamMemberUpdate = async () => {
    try {
      await dispatch(fetchTeamMembers()).unwrap();
      setEditingMember(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error refreshing team members:", error);
    }
  };

  const handleEdit = (member) => setEditingMember(member);

  const handleDelete = async (member) => {
    if (!window.confirm(`Delete ${member.name}? This action cannot be undone.`)) return;
    try {
      await dispatch(deleteTeamMember(member.id)).unwrap();
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
        (statusFilter === "null" ? !member.status : (member.status || "").toLowerCase() === statusFilter);

      const matchesDepartment = departmentFilter === "All" || member.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [teamMembers, searchTerm, statusFilter, departmentFilter]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Real per-member open-task counts, derived from actual Task records
  // (not the fabricated `tasks*25 + clients*10` formula this used to show).
  const workloadById = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== "completed");
    const counts = teamMembers.map((member) => ({
      id: member.id,
      count: openTasks.filter((t) => (t.assignees || []).map(Number).includes(member.id)).length,
    }));
    const maxCount = Math.max(1, ...counts.map((c) => c.count));
    return counts.reduce((acc, c) => {
      acc[c.id] = { openTaskCount: c.count, widthPercent: Math.round((c.count / maxCount) * 100) };
      return acc;
    }, {});
  }, [teamMembers, tasks]);

  // Real per-member client lists, combining live Client.clientManagedBy
  // assignments (set from the Clients page or the Assign Client modal)
  // with the legacy TeamMember.clientHandling text field, so the table
  // doesn't show "None assigned" for clients that were only ever linked
  // via clientManagedBy.
  const clientNamesById = useMemo(() => {
    return teamMembers.reduce((acc, member) => {
      const legacyNames = parseArrayField(member.clientHandling);
      const realNames = clients
        .filter((c) => String(c.clientManagedBy) === String(member.id))
        .map((c) => c.name);
      const merged = [...realNames];
      legacyNames.forEach((name) => {
        if (!merged.some((n) => n.toLowerCase() === name.toLowerCase())) merged.push(name);
      });
      acc[member.id] = merged;
      return acc;
    }, {});
  }, [teamMembers, clients]);

  const stats = useMemo(() => {
    const activeNow = teamMembers.filter((m) => (m.status || "").toLowerCase() === "active").length;
    const openTasks = tasks.filter((t) => t.status !== "completed").length;
    const now = new Date();
    const completedThisWeek = tasks.filter(
      (t) => t.status === "completed" && t.completedAt && now - new Date(t.completedAt) <= 7 * MS_PER_DAY
    ).length;

    return { totalMembers: teamMembers.length, activeNow, openTasks, completedThisWeek };
  }, [teamMembers, tasks]);

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      <TeamToolbar teamMembers={teamMembers} onAddMember={() => setShowAddModal(true)} />

      <TeamStats stats={stats} />

      <div className="bg-white rounded-lg border border-outline-variant shadow-card overflow-hidden">
        <TeamFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          departmentFilter={departmentFilter}
          onDepartmentChange={(value) => {
            setDepartmentFilter(value);
            setCurrentPage(1);
          }}
        />

        <TeamTable
          members={paginatedMembers}
          workloadById={workloadById}
          clientNamesById={clientNamesById}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <TeamPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredMembers.length}
          onPageChange={setCurrentPage}
        />
      </div>

      <AddTeamMemberModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleTeamMemberUpdate} />

      {editingMember && (
        <EditMemberModal isOpen={true} onClose={() => setEditingMember(null)} onSuccess={handleTeamMemberUpdate} member={editingMember} />
      )}
    </div>
  );
}
