import { apiClient } from "./apiClient";

export const fetchMiscTasks = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient(`/misc-tasks?${queryString}`);
  return response;
};

export const saveMiscTask = async (formData) => {
  const response = await apiClient("/misc-tasks/upload", {
    method: "POST",
    body: formData,
  });
  return response;
};

export const updateMiscTask = async (id, updateData) => {
  const response = await apiClient(`/misc-tasks/${id}`, {
    method: "PUT",
    body: updateData,
  });
  return response;
};

export const deleteMiscTask = async (id) => {
  const response = await apiClient(`/misc-tasks/${id}`, { method: "DELETE" });
  return response;
};
