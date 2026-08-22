import { apiClient } from "./apiClient";

export const fetchMeetingNotes = async (clientId) => {
  const queryString = clientId ? `?clientId=${clientId}` : "";
  const response = await apiClient(`/meeting-notes${queryString}`);
  return response;
};

export const fetchMeetingNote = async (id) => {
  const response = await apiClient(`/meeting-notes/${id}`);
  return response;
};

export const createMeetingNote = async (meetingData) => {
  const response = await apiClient("/meeting-notes", {
    method: "POST",
    body: meetingData,
  });
  return response;
};

export const updateMeetingNote = async (id, updateData) => {
  const response = await apiClient(`/meeting-notes/${id}`, {
    method: "PUT",
    body: updateData,
  });
  return response;
};

export const deleteMeetingNote = async (id) => {
  const response = await apiClient(`/meeting-notes/${id}`, { method: "DELETE" });
  return response;
};
