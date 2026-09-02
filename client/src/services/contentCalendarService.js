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

export const syncGoogleSheet = async ({ clientId, sheetUrl, clearExisting = false }) => {
  const response = await apiClient("/content-calendar/sync-google-sheet", {
    method: "POST",
    body: { clientId, sheetUrl, clearExisting },
  });
  return response;
};

export const importCalendarFile = async ({ clientId, file, clearExisting = false }) => {
  const formData = new FormData();
  formData.append("clientId", clientId);
  formData.append("clearExisting", clearExisting);
  formData.append("file", file);

  const response = await apiClient("/content-calendar/import-file", {
    method: "POST",
    body: formData,
  });
  return response;
};

export const fetchLiveCalendar = async (clientId, sheetUrl = "") => {
  const query = sheetUrl ? `?sheetUrl=${encodeURIComponent(sheetUrl)}` : "";
  const response = await apiClient(`/content-calendar/live/${clientId}${query}`);
  return response;
};

export const saveClientSheetUrl = async ({ clientId, sheetUrl }) => {
  const response = await apiClient("/content-calendar/save-sheet-url", {
    method: "POST",
    body: { clientId, sheetUrl },
  });
  return response;
};

export { fetchClients } from "./clientService";


