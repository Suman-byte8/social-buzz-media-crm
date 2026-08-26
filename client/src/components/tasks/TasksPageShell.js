"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchTasks, deleteTask, updateTask } from "@/services/taskService";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import TasksToolbar from "@/components/tasks/TasksToolbar";
import TasksFilters from "@/components/tasks/TasksFilters";
import TasksBoard from "@/components/tasks/TasksBoard";

const COLUMN_IDS = ["todo", "in_progress", "review", "completed"];
const SEARCH_DEBOUNCE_MS = 350;

export default function TasksPageShell({ tasks: initialTasks, clients, teamMembers }) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
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

  const isFirstRun = useRef(true);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchTasks({
        limit: 200,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        clientId: clientFilter !== "all" ? clientFilter : undefined,
        assigneeId: assigneeFilter !== "all" ? assigneeFilter : undefined,
      });
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, clientFilter, assigneeFilter]);

  useEffect(() => {
    // The server component already fetched the unfiltered initial task list —
    // skip the redundant duplicate fetch on first mount.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    refreshTasks();
  }, [refreshTasks]);

  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      alert("Failed to update task status.");
    }
  };

  const handleEdit = (task) => setEditingTask(task);

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditingTask(null);
    refreshTasks();
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
        clients={clients}
        teamMembers={teamMembers}
        editTask={null}
      />

      {editingTask && (
        <AddTaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSuccess={handleSuccess}
          clients={clients}
          teamMembers={teamMembers}
          editTask={editingTask}
        />
      )}
    </div>
  );
}
