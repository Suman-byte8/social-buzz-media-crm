import { apiClient } from "./apiClient";

const cleanParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});

export const fetchContentCalendarEntries = async (params = {}) => {
  const queryString = new URLSearchParams(cleanParams(params)).toString();
  const response = await apiClient(`/content-calendar?${queryString}`);
  return response;
};

export const fetchContentCalendarEntry = async (id) => {
  const response = await apiClient(`/content-calendar/${id}`);
  return response;
};

export const createContentCalendarEntry = async (data) => {
  const response = await apiClient("/content-calendar", {
    method: "POST",
    body: data,
  });
  return response;
};

export const updateContentCalendarEntry = async (id, data) => {
  const response = await apiClient(`/content-calendar/${id}`, {
    method: "PUT",
    body: data,
  });
  return response;
};

export const deleteContentCalendarEntry = async (id) => {
  const response = await apiClient(`/content-calendar/${id}`, { method: "DELETE" });
  return response;
};

export const uploadCreatives = async (entryId, files) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  return apiClient(`/content-calendar/${entryId}/creatives`, {
    method: "POST",
    body: formData,
  });
};

export const deleteCreative = async (entryId, fileId) => {
  const response = await apiClient(`/content-calendar/${entryId}/creatives/${fileId}`, {
    method: "DELETE",
  });
  return response;
};

export { fetchClients } from "./clientService";
