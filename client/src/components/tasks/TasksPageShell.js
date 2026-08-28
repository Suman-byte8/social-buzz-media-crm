"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, deleteTask, updateTask, setTaskStatusLocal } from "@/redux/slices/tasksSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import AddTaskModal from "@/components/tasks/AddTaskModal";
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

  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await dispatch(deleteTask(task.id)).unwrap();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
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

  const handleEdit = (task) => setEditingTask(task);

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditingTask(null);
    dispatch(fetchTasks(currentFilters));
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
      />

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
