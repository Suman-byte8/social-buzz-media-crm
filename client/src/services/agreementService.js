import { apiClient } from "./apiClient";

// ── Agreement drafts (the generator's editable records) ─────────────────
// Deliberately under /agreement-drafts, not /agreements — documentRoutes.js
// already owns /agreements/:id for the existing upload-based Agreements
// feature, and nesting under that path risks an Express route-ordering
// collision (a literal /agreements/drafts would match /agreements/:id's
// wildcard first). See agreementBuilderRoutes.js's header comment.

export const fetchAgreementDrafts = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const queryString = query.toString();
  return apiClient(`/agreement-drafts${queryString ? `?${queryString}` : ""}`);
};

export const fetchAgreementDraftById = async (id) => apiClient(`/agreement-drafts/${id}`);

export const createAgreementDraft = async ({ clientId, templateId, title, effectiveDate }) =>
  apiClient("/agreement-drafts", { method: "POST", body: { clientId, templateId, title, effectiveDate } });

// `expectedRevision` lets the caller detect a concurrent edit (see
// agreementBuilderRoutes.js PUT /agreement-drafts/:id) — omit it to
// force-save regardless.
export const updateAgreementDraft = async (id, { title, documentData, expectedRevision }) =>
  apiClient(`/agreement-drafts/${id}`, { method: "PUT", body: { title, documentData, expectedRevision } });

export const finalizeAgreementDraft = async (id, note) => apiClient(`/agreement-drafts/${id}/finalize`, { method: "POST", body: { note } });

export const duplicateAgreementDraft = async (id) => apiClient(`/agreement-drafts/${id}/duplicate`, { method: "POST" });

export const trashAgreementDraft = async (id) => apiClient(`/agreement-drafts/${id}`, { method: "DELETE" });

export const restoreAgreementDraft = async (id) => apiClient(`/agreement-drafts/${id}/restore`, { method: "POST" });

export const updateAgreementStatus = async (id, status) => apiClient(`/agreement-drafts/${id}/status`, { method: "PUT", body: { status } });

// ── Export / signed copy ─────────────────────────────────────────────────

export const exportAgreementDraft = async (id, { pdfBlob, docxBlob, fileNameBase }) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, `${fileNameBase}.pdf`);
  if (docxBlob) formData.append("docx", docxBlob, `${fileNameBase}.docx`);
  return apiClient(`/agreement-drafts/${id}/export`, { method: "POST", body: formData });
};

export const uploadSignedCopy = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient(`/agreement-drafts/${id}/signed-copy`, { method: "POST", body: formData });
};

// ── Versions / activity ──────────────────────────────────────────────────

export const fetchAgreementVersions = async (id) => apiClient(`/agreement-drafts/${id}/versions`);

export const restoreAgreementVersion = async (id, versionId) =>
  apiClient(`/agreement-drafts/${id}/versions/${versionId}/restore`, { method: "POST" });

export const fetchAgreementActivity = async (id) => apiClient(`/agreement-drafts/${id}/activity`);

// ── Templates ────────────────────────────────────────────────────────────

export const fetchAgreementTemplates = async () => apiClient("/agreement-templates");

export const saveAgreementTemplate = async ({ agreementId, name, description, isShared }) =>
  apiClient("/agreement-templates", { method: "POST", body: { agreementId, name, description, isShared } });

export const deleteAgreementTemplate = async (id) => apiClient(`/agreement-templates/${id}`, { method: "DELETE" });
