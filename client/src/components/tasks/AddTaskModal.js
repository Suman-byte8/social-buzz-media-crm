"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTask, updateTask } from "@/redux/slices/tasksSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";

export default function AddTaskModal({ isOpen, onClose, onSuccess, editTask = null }) {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { teamMembers } = useSelector((state) => state.team);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [clientId, setClientId] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditMode = editTask !== null;

  useEffect(() => {
    if (isOpen) {
      if (!clients || clients.length === 0) {
        dispatch(fetchClients({ limit: 100 }));
      }
      if (!teamMembers || teamMembers.length === 0) {
        dispatch(fetchTeamMembers());
      }
    }
  }, [isOpen, clients.length, teamMembers.length, dispatch]);

  useEffect(() => {
    if (isEditMode && editTask) {
      setTitle(editTask.title || "");
      setDescription(editTask.description || "");
      setPriority(editTask.priority || "medium");
      setClientId(editTask.clientId || "");
      setAssignees(editTask.assignees || []);
      setDueDate(editTask.dueDate ? new Date(editTask.dueDate).toISOString().split("T")[0] : "");
    }
  }, [editTask, isEditMode]);

  const handleAssigneeToggle = (memberId) => {
    const id = String(memberId);
    if (assignees.includes(id)) {
      setAssignees(assignees.filter((a) => a !== id));
    } else {
      setAssignees([...assignees, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!title.trim()) {
      setError("Task title is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        clientId: clientId ? parseInt(clientId) : null,
        assignees: assignees.map(Number),
        dueDate: dueDate || null,
      };

      if (isEditMode && editTask) {
        await dispatch(updateTask({ id: editTask.id, taskData })).unwrap();
      } else {
        await dispatch(createTask(taskData)).unwrap();
      }

      setSuccess("Task saved successfully!");
      onClose();
      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (error) {
      setError((typeof error === "string" ? error : error?.message) || "Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setClientId("");
      setAssignees([]);
      setDueDate("");
      setError("");
      setSuccess("");
      onClose();
    }
  };

  if (!isOpen) return null;

  const priorityOptions = [
    { value: "urgent", label: "Urgent", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { value: "high", label: "High", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    { value: "medium", label: "Medium", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { value: "low", label: "Low", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  ];

  const selectedPriority = priorityOptions.find((p) => p.value === priority) || priorityOptions[2];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {isEditMode ? "edit" : "add_task"}
            </span>
            {isEditMode ? "Edit Task" : "Add New Task"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              rows="4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
                Priority
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className={`w-8 h-8 rounded ${selectedPriority.bg} ${selectedPriority.border} border flex items-center justify-center flex-shrink-0`}
                >
                  <span className={`material-symbols-outlined text-[14px] ${selectedPriority.color}`}>
                    {priority === "urgent" ? "priority_high" : priority === "high" ? "whatshot" : priority === "medium" ? "schedule" : "low_priority"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
              Related Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">No specific client (Internal Task)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-gray-700 mb-1">
              Assign To
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {teamMembers.map((member) => {
                const initials = member.name
                  ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                  : "?";
                const isSelected = assignees.includes(String(member.id));
                return (
                  <div
                    key={member.id}
                    onClick={() => handleAssigneeToggle(member.id)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <span className="font-label-md text-label-md text-primary font-bold">
                        {initials}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-body-md text-body-md text-on-surface">{member.name}</div>
                      <div className="font-label-sm text-label-sm text-tertiary">
                        {member.designation || member.department || "Team Member"}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">
                    <span className="material-symbols-outlined text-[16px]">progress_activity</span>
                  </span>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {isEditMode ? "save" : "add_task"}
                  </span>
                  {isEditMode ? "Update Task" : "Create Task"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
