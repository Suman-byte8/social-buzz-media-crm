"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchTasks, deleteTask, updateTask } from "@/services/taskService";
import AddTaskModal from "@/components/tasks/AddTaskModal";

const PRIORITY_COLORS = {
  urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  medium: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  low: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", dot: "bg-gray-400" },
};

const STATUS_COLUMNS = [
  { id: "todo", title: "Backlog", count: 0 },
  { id: "in_progress", title: "In Progress", count: 0 },
  { id: "review", title: "Review", count: 0 },
  { id: "completed", title: "Completed", count: 0 },
];

export default function TasksPageShell({ tasks: initialTasks, clients, teamMembers, stats: initialStats }) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const refreshTasks = useCallback(async () => {
    try {
      const response = await fetchTasks({
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        clientId: clientFilter !== "all" ? clientFilter : undefined,
      });
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [searchTerm, statusFilter, priorityFilter, clientFilter]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const response = await updateTask(task.id, { status: newStatus });
      const updatedTask = response.data;
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status.");
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
  };

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditingTask(null);
    refreshTasks();
  };

  const columns = [
    { id: "todo", title: "Backlog" },
    { id: "in_progress", title: "In Progress" },
    { id: "review", title: "Review" },
    { id: "completed", title: "Completed" },
  ];

  const tasksByColumn = useMemo(() => {
    const result = {};
    columns.forEach((col) => {
      result[col.id] = tasks.filter((t) => t.status === col.id);
    });
    return result;
  }, [tasks]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Track and manage agency deliverables</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-300 text-on-surface rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
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
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-300 text-on-surface rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
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
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-300 text-on-surface rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
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
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-gray-50 rounded-lg p-3 min-h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">
                {column.title}
              </h3>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tasksByColumn[column.id].length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1">
              {tasksByColumn[column.id].map((task) => {
                const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
                const taskAssignees = task.assigneeDetails || [];

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status !== "todo" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(task, "todo"); }}
                            className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Move to Backlog"
                          >
                            <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                          </button>
                        )}
                        {task.status !== "in_progress" && task.status !== "completed" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(task, "in_progress"); }}
                            className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Move to In Progress"
                          >
                            <span className="material-symbols-outlined text-[12px]">play_arrow</span>
                          </button>
                        )}
                        {task.status === "in_progress" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(task, "review"); }}
                            className="p-0.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Move to Review"
                          >
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                          </button>
                        )}
                        {task.status === "review" && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(task, "in_progress"); }}
                              className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Move back to In Progress"
                            >
                              <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(task, "completed"); }}
                              className="p-0.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Mark as Completed"
                            >
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            </button>
                          </>
                        )}
                        {task.status === "completed" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(task, "review"); }}
                            className="p-0.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Move back to Review"
                          >
                            <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                          className="p-1 text-gray-600 hover:text-primary rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                          className="p-1 text-gray-600 hover:text-red-600 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {task.clientName && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                            {task.clientName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">
                              calendar_today
                            </span>
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      {taskAssignees.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {taskAssignees.slice(0, 3).map((assignee) => {
                            const initials = assignee.name
                              ? assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                              : "?";
                            return (
                              <div
                                key={assignee.id}
                                className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold border-2 border-white"
                                title={assignee.name}
                              >
                                {initials}
                              </div>
                            );
                          })}
                          {taskAssignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] border-2 border-white">
                              +{taskAssignees.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
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
