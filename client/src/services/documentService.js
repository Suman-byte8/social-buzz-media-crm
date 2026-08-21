import { apiClient } from "./apiClient";

export const fetchDocuments = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient(`/documents?${queryString}`);
  return response;
};

export const fetchDocumentsByClient = async (clientId) => {
  const response = await apiClient(`/documents?clientId=${clientId}`);
  return response;
};

export const fetchDocumentById = async (id) => {
  const response = await apiClient(`/documents/${id}`);
  return response;
};

export const uploadDocument = async (file, clientId, description = "") => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const formData = new FormData();
  formData.append("file", file);
  if (clientId) formData.append("clientId", clientId);
  if (description) formData.append("description", description);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

export const deleteDocument = async (id) => {
  const response = await apiClient(`/documents/${id}`, {
    method: "DELETE",
  });
  return response;
};
