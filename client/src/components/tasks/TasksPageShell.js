"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, deleteTask, updateTask, setTaskStatusLocal } from "@/redux/slices/tasksSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import TaskViewModal from "@/components/tasks/TaskViewModal";
import TasksToolbar from "@/components/tasks/TasksToolbar";
import TasksFilters from "@/components/tasks/TasksFilters";
import TasksTable from "@/components/tasks/TasksTable";

const SEARCH_DEBOUNCE_MS = 350;
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK = { todo: 0, in_progress: 1, review: 2, completed: 3 };

export default function TasksPageShell() {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { clients } = useSelector((state) => state.clients);
  const { teamMembers } = useSelector((state) => state.team);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [assignedDateFilter, setAssignedDateFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  // Defaults to latest-created-first (matches the server's own order —
  // see taskRoutes.js's `order: [["createdAt", "DESC"]]` — so the list
  // isn't silently re-ordered by this client-side sort until someone
  // actually clicks a column header).
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Seed filters from URL query params (e.g. deep-linked from a team member's profile).
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlAssignee = params.get("assigneeId");
      const urlSearch = params.get("search");
      if (urlAssignee) setAssigneeFilter(urlAssignee);
      if (urlSearch) {
        setSearchInput(urlSearch);
        setSearchTerm(urlSearch);
      }
    }
  }, []);

  // Debounce free-text search so every keystroke doesn't trigger a fetch.
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch clients and team members once on mount (client-side, so the board
  // never trusts stale build-time data from the static export).
  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  const currentFilters = useMemo(
    () => ({
      limit: 200,
      search: searchTerm,
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      clientId: clientFilter !== "all" ? clientFilter : undefined,
      assigneeId: assigneeFilter !== "all" ? assigneeFilter : undefined,
      assignedDate: assignedDateFilter || undefined,
    }),
    [searchTerm, statusFilter, priorityFilter, clientFilter, assigneeFilter, assignedDateFilter]
  );

  // Re-fetch tasks on mount and whenever a filter changes.
  useEffect(() => {
    dispatch(fetchTasks(currentFilters));
  }, [dispatch, currentFilters]);

  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return false;
    try {
      await dispatch(deleteTask(task.id)).unwrap();
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
      return false;
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    dispatch(setTaskStatusLocal({ id: task.id, status: newStatus }));
    try {
      await dispatch(updateTask({ id: task.id, taskData: { status: newStatus } })).unwrap();
    } catch (error) {
      console.error("Error updating task status:", error);
      dispatch(setTaskStatusLocal({ id: task.id, status: task.status }));
      alert("Failed to update task status.");
    }
  };

  const handleEdit = (task) => {
    setViewingTask(null);
    setEditingTask(task);
  };

  const handleView = (task) => setViewingTask(task);

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditingTask(null);
    dispatch(fetchTasks(currentFilters));
  };

  const handleDeleteFromView = async (task) => {
    const deleted = await handleDelete(task);
    if (deleted) setViewingTask(null);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  // Tasks are fetched flat (no server-side sort support), so sorting for
  // the table view happens here on the already-fetched page.
  const sortedTasks = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "clientName":
          cmp = (a.clientName || "").localeCompare(b.clientName || "");
          break;
        case "priority":
          cmp = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
          break;
        case "status":
          cmp = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
          break;
        case "dueDate": {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aTime - bTime;
          break;
        }
        case "createdAt": {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = aTime - bTime;
          break;
        }
        default:
          cmp = 0;
      }
      return sortOrder === "ASC" ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sortBy, sortOrder]);

  const stats = useMemo(
    () => ({
      totalTasks: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks]
  );

  return (
    <div className="flex-1 p-6 lg:p-8 w-full">
      <TasksToolbar stats={stats} onNewTask={() => setShowAddModal(true)} />

      <TasksFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        clientFilter={clientFilter}
        onClientChange={setClientFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        assignedDateFilter={assignedDateFilter}
        onAssignedDateChange={setAssignedDateFilter}
        clients={clients}
        teamMembers={teamMembers}
      />

      <TasksTable
        tasks={sortedTasks}
        loading={loading}
        hasAnyTasks={tasks.length > 0}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {viewingTask && (
        <TaskViewModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteFromView}
        />
      )}

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
        editTask={null}
      />

      {editingTask && (
        <AddTaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSuccess={handleSuccess}
          editTask={editingTask}
        />
      )}
    </div>
  );
}
