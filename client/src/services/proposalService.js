import { apiClient } from "./apiClient";

// ── Proposal drafts (the generator's editable records) ──────────────────
// Deliberately under /proposal-drafts, not /proposals — documentRoutes.js
// already owns /proposals/* for the existing upload-based Proposals
// feature, and nesting under that path risks an Express route-ordering
// collision. See proposalBuilderRoutes.js's header comment (mirrors the
// same reasoning agreementService.js already documents for /agreement-drafts).

export const fetchProposalDrafts = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const queryString = query.toString();
  return apiClient(`/proposal-drafts${queryString ? `?${queryString}` : ""}`);
};

export const fetchProposalDraftById = async (id) => apiClient(`/proposal-drafts/${id}`);

export const createProposalDraft = async ({ clientId, templateId, title, dateOfIssue }) =>
  apiClient("/proposal-drafts", { method: "POST", body: { clientId, templateId, title, dateOfIssue } });

// `expectedRevision` lets the caller detect a concurrent edit (see
// proposalBuilderRoutes.js PUT /proposal-drafts/:id) — omit it to
// force-save regardless.
export const updateProposalDraft = async (id, { title, documentData, expectedRevision }) =>
  apiClient(`/proposal-drafts/${id}`, { method: "PUT", body: { title, documentData, expectedRevision } });

export const finalizeProposalDraft = async (id, note) => apiClient(`/proposal-drafts/${id}/finalize`, { method: "POST", body: { note } });

export const duplicateProposalDraft = async (id) => apiClient(`/proposal-drafts/${id}/duplicate`, { method: "POST" });

export const trashProposalDraft = async (id) => apiClient(`/proposal-drafts/${id}`, { method: "DELETE" });

export const restoreProposalDraft = async (id) => apiClient(`/proposal-drafts/${id}/restore`, { method: "POST" });

export const updateProposalStatus = async (id, status) => apiClient(`/proposal-drafts/${id}/status`, { method: "PUT", body: { status } });

// ── Export ────────────────────────────────────────────────────────────────

export const exportProposalDraft = async (id, { pdfBlob, docxBlob, fileNameBase }) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, `${fileNameBase}.pdf`);
  if (docxBlob) formData.append("docx", docxBlob, `${fileNameBase}.docx`);
  return apiClient(`/proposal-drafts/${id}/export`, { method: "POST", body: formData });
};

// ── Versions / activity ──────────────────────────────────────────────────

export const fetchProposalVersions = async (id) => apiClient(`/proposal-drafts/${id}/versions`);

export const restoreProposalVersion = async (id, versionId) =>
  apiClient(`/proposal-drafts/${id}/versions/${versionId}/restore`, { method: "POST" });

export const fetchProposalActivity = async (id) => apiClient(`/proposal-drafts/${id}/activity`);

// ── Templates ────────────────────────────────────────────────────────────

export const fetchProposalTemplates = async () => apiClient("/proposal-templates");

export const saveProposalTemplate = async ({ proposalId, name, description, isShared }) =>
  apiClient("/proposal-templates", { method: "POST", body: { proposalId, name, description, isShared } });

export const deleteProposalTemplate = async (id) => apiClient(`/proposal-templates/${id}`, { method: "DELETE" });
