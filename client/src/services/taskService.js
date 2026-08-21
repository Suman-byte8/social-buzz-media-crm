import { apiClient } from "./apiClient";

const parseAssignees = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return val.toString().split(",").map(s => s.trim()).filter(Boolean);
  }
};

export const fetchTasks = async (params = {}) => {
  const cleanParams = Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
  const queryString = new URLSearchParams(cleanParams).toString();
  const response = await apiClient(`/tasks?${queryString}`);
  return response;
};

export const fetchTasksByClient = async (clientId) => {
  const response = await apiClient(`/tasks?clientId=${clientId}`);
  return response;
};

export const fetchTasksByAssignee = async (assigneeId) => {
  const response = await apiClient(`/tasks?assigneeId=${assigneeId}`);
  return response;
};

export const fetchTaskById = async (id) => {
  const response = await apiClient(`/tasks/${id}`);
  return response;
};

export const createTask = async (taskData) => {
  const response = await apiClient("/tasks", {
    method: "POST",
    body: taskData,
  });
  return response;
};

export const updateTask = async (id, taskData) => {
  const response = await apiClient(`/tasks/${id}`, {
    method: "PUT",
    body: taskData,
  });
  return response;
};

export const deleteTask = async (id) => {
  const response = await apiClient(`/tasks/${id}`, {
    method: "DELETE",
  });
  return response;
};

export const formatTaskData = (formData) => ({
  title: formData.title || "",
  description: formData.description || "",
  status: formData.status || "todo",
  priority: formData.priority || "medium",
  clientId: formData.clientId ? parseInt(formData.clientId) : null,
  assignees: Array.isArray(formData.assignees) ? formData.assignees.map(Number) : [],
  dueDate: formData.dueDate || null,
  completedAt: formData.completedAt || null,
});
