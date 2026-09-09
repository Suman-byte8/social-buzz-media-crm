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

// ── Invoice Documents ────────────────────────────────────────────────────
// The PDFs saved to Drive via the Invoice Builder's "Save to Drive" action
// (documentType: "invoice") — distinct from the legacy free-text
// `client.invoices` field.

export const fetchInvoiceDocuments = async (clientId) => {
  const params = new URLSearchParams({ documentType: "invoice" });
  if (clientId) params.append("clientId", clientId);
  const response = await apiClient(`/documents?${params.toString()}`);
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

export const uploadBrandKitFilesBulk = async (formData) => {
  const response = await apiClient("/documents/upload-media-bulk", {
    method: "POST",
    body: formData,
  });
  return response;
};

// ── Client Files (generic per-client tabs: Creatives, Strategy, ...) ────────
// Reuses the same media-capable upload/list/delete endpoints as Brand Kit,
// just parametrized by documentType instead of a dedicated set of routes.

export const fetchClientFilesByType = async ({ clientId, documentType }) => {
  const params = new URLSearchParams({ documentType });
  if (clientId) params.append("clientId", clientId);
  const response = await apiClient(`/documents?${params.toString()}`);
  return response;
};

export const uploadClientFilesBulk = async (formData) => {
  const response = await apiClient("/documents/upload-media-bulk", {
    method: "POST",
    body: formData,
  });
  return response;
};

// ── Lead Documents (proposals/agreements shared before conversion) ─────────

export const fetchLeadDocuments = async (leadId) => {
  const params = new URLSearchParams({ leadId, documentType: "lead" });
  const response = await apiClient(`/documents?${params.toString()}`);
  return response;
};

export const uploadLeadDocumentsBulk = async (formData) => {
  const response = await apiClient("/documents/upload-lead-bulk", {
    method: "POST",
    body: formData,
  });
  return response;
};

// ── Agreements ───────────────────────────────────────────────────────────

// Accepts either a bare clientId (existing callers — e.g. a client
// profile's Agreement tab wanting its one client's full, unpaginated
// list) or a params object ({ clientId, status, search, page, limit } —
// the admin Agreements page's paginated/searchable view).
export const fetchAgreements = async (paramsOrClientId) => {
  const params =
    paramsOrClientId && typeof paramsOrClientId === "object" ? paramsOrClientId : { clientId: paramsOrClientId };
  const query = new URLSearchParams();
  if (params.clientId) query.append("clientId", params.clientId);
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const queryString = query.toString();
  const response = await apiClient(`/agreements${queryString ? `?${queryString}` : ""}`);
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