import { apiClient } from "./apiClient";

// ── Documents ────────────────────────────────────────────────────────────

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
  const formData = new FormData();
  formData.append("file", file);
  if (clientId) formData.append("clientId", clientId);
  if (description) formData.append("description", description);

  return apiClient("/documents/upload", {
    method: "POST",
    body: formData,
  });
};

export const deleteDocument = async (id) => {
  const response = await apiClient(`/documents/${id}`, { method: "DELETE" });
  return response;
};

// Fetches the raw PDF bytes for an already-uploaded document (agreement,
// invoice, etc.) — used to hand the actual file to the Web Share API
// instead of sharing a link.
export const fetchDocumentBlob = async (id) => {
  return apiClient(`/documents/${id}/stream`, { responseType: "blob" });
};

// ── Proposals ────────────────────────────────────────────────────────────

export const fetchProposals = async (clientId) => {
  const params = new URLSearchParams({ documentType: "proposal" });
  if (clientId) params.append("clientId", clientId);
  const response = await apiClient(`/documents?${params.toString()}`);
  return response;
};

export const uploadProposal = async (formData) => {
  const response = await apiClient("/documents/upload", {
    method: "POST",
    body: formData,
  });
  return response;
};

// ── Brand Kit ────────────────────────────────────────────────────────────

export const fetchBrandKitFiles = async (clientId) => {
  const params = new URLSearchParams({ documentType: "brand_kit" });
  if (clientId) params.append("clientId", clientId);
  const response = await apiClient(`/documents?${params.toString()}`);
  return response;
};

export const uploadBrandKitFile = async (formData) => {
  const response = await apiClient("/documents/upload-media", {
    method: "POST",
    body: formData,
  });
  return response;
};

// ── Agreements ───────────────────────────────────────────────────────────

export const fetchAgreements = async (clientId) => {
  const queryString = clientId ? `?clientId=${clientId}` : '';
  const response = await apiClient(`/agreements${queryString}`);
  return response;
};

export const fetchAgreement = async (id) => {
  const response = await apiClient(`/agreements/${id}`);
  return response;
};

export const uploadAgreement = async (formData) => {
  const response = await apiClient("/agreements/upload", {
    method: "POST",
    body: formData,
  });
  return response.data;
};

export const updateAgreement = async (id, updateData) => {
  const response = await apiClient(`/agreements/${id}`, {
    method: "PUT",
    body: updateData,
  });
  return response;
};

export const deleteAgreement = async (id) => {
  const response = await apiClient(`/agreements/${id}`, { method: "DELETE" });
  return response;
};
export { fetchClients } from "./clientService";