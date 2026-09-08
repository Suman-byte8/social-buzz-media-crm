"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, deleteTask, updateTask, setTaskStatusLocal } from "@/redux/slices/tasksSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import { getSocket } from "@/lib/socket";
import { invalidateCache as invalidateLocalCache } from "@/utils/cache";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import TaskViewModal from "@/components/tasks/TaskViewModal";
import TasksToolbar from "@/components/tasks/TasksToolbar";
import TasksFilters from "@/components/tasks/TasksFilters";
import TasksBoard from "@/components/tasks/TasksBoard";

const COLUMN_IDS = ["todo", "in_progress", "review", "completed"];
const SEARCH_DEBOUNCE_MS = 350;

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
  const [monthFilter, setMonthFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);

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
      month: monthFilter || undefined,
    }),
    [searchTerm, statusFilter, priorityFilter, clientFilter, assigneeFilter, monthFilter]
  );

  // Re-fetch tasks on mount and whenever a filter changes.
  useEffect(() => {
    dispatch(fetchTasks(currentFilters));
  }, [dispatch, currentFilters]);

  // Live updates: the Tasks board is the surface most likely to have
  // several people editing at once, so it gets an active refetch (using
  // *its own* current filters, not a generic one) rather than just relying
  // on RealtimeBridge's global cache-drop and waiting for the next natural
  // navigation. invalidateLocalCache is called here too (not just relying
  // on RealtimeBridge's own call for the same event) so this refetch is
  // guaranteed to hit the network instead of replaying the stale cached
  // response for these exact filters within its TTL window.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleChange = ({ resource } = {}) => {
      // Server-side broadcasts use the short resource name passed to
      // cacheRoute()/invalidateCache() in taskRoutes.js ("tasks"), not the
      // longer client-side thunk type-prefix ("tasks/fetchTasks").
      if (resource !== "tasks") return;
      invalidateLocalCache(resource);
      dispatch(fetchTasks(currentFilters));
    };

    socket.on("data:changed", handleChange);
    return () => socket.off("data:changed", handleChange);
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

  const tasksByColumn = useMemo(() => {
    const result = {};
    COLUMN_IDS.forEach((id) => {
      result[id] = tasks.filter((t) => t.status === id);
    });
    return result;
  }, [tasks]);

  const stats = useMemo(
    () => ({
      totalTasks: tasks.length,
      todo: tasksByColumn.todo.length,
      in_progress: tasksByColumn.in_progress.length,
      review: tasksByColumn.review.length,
      completed: tasksByColumn.completed.length,
    }),
    [tasks, tasksByColumn]
  );

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto">
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
        monthFilter={monthFilter}
        onMonthChange={setMonthFilter}
        clients={clients}
        teamMembers={teamMembers}
      />

      <TasksBoard
        tasksByColumn={tasksByColumn}
        loading={loading}
        hasAnyTasks={tasks.length > 0}
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
