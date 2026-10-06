import { apiClient } from "./apiClient";

// ── Reports ──────────────────────────────────────────────────────────────

export const fetchReports = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const queryString = query.toString();
  return apiClient(`/reports${queryString ? `?${queryString}` : ""}`);
};

export const fetchReportById = async (id) => apiClient(`/reports/${id}`);

export const createReport = async ({ clientId, title, templateKey, templateId }) =>
  apiClient("/reports", { method: "POST", body: { clientId, title, templateKey, templateId } });

// "Auto-generate from screenshots" — uploads every file and asks Gemini to
// propose a title/grouping/headings/KPIs, building a real editable report
// from the result (see reportRoutes.js POST /reports/auto-generate). Always
// succeeds at creating *a* report even if the AI analysis itself fails —
// check the response's `aiGenerated` flag to know which happened.
export const autoGenerateReport = async ({ clientId, title, files }) => {
  const formData = new FormData();
  formData.append("clientId", clientId);
  if (title) formData.append("title", title);
  files.forEach((file) => formData.append("files", file));
  return apiClient("/reports/auto-generate", { method: "POST", body: formData });
};

// `expectedRevision` lets the caller detect a concurrent edit (see
// reportRoutes.js PUT /reports/:id) — omit it to force-save regardless.
export const updateReport = async (id, { title, documentData, expectedRevision }) =>
  apiClient(`/reports/${id}`, { method: "PUT", body: { title, documentData, expectedRevision } });

export const duplicateReport = async (id) => apiClient(`/reports/${id}/duplicate`, { method: "POST" });

export const trashReport = async (id) => apiClient(`/reports/${id}`, { method: "DELETE" });

export const restoreReport = async (id) => apiClient(`/reports/${id}/restore`, { method: "POST" });

export const permanentlyDeleteReport = async (id) => apiClient(`/reports/${id}/permanent`, { method: "DELETE" });

// ── Assets (screenshots used inside a report) ───────────────────────────

export const uploadReportAsset = async (reportId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient(`/reports/${reportId}/assets`, { method: "POST", body: formData });
};

export const fetchReportAssets = async (reportId) => apiClient(`/reports/${reportId}/assets`);

// Reuses the generic, already-admin-safe document delete route — a report
// asset is just a Document row with documentType "report_asset".
export const deleteReportAsset = async (assetId) => apiClient(`/documents/${assetId}`, { method: "DELETE" });

// ── Export ───────────────────────────────────────────────────────────────

export const exportReportToDrive = async (reportId, pdfBlob, fileName) => {
  const formData = new FormData();
  formData.append("file", pdfBlob, fileName);
  return apiClient(`/reports/${reportId}/export`, { method: "POST", body: formData });
};

// ── Templates ────────────────────────────────────────────────────────────

export const fetchReportTemplates = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/report-templates${query ? `?${query}` : ""}`);
};

export const saveReportTemplate = async ({ reportId, name, description, category, isShared }) =>
  apiClient("/report-templates", { method: "POST", body: { reportId, name, description, category, isShared } });

export const updateReportTemplate = async (id, updateData) =>
  apiClient(`/report-templates/${id}`, { method: "PUT", body: updateData });

export const deleteReportTemplate = async (id) => apiClient(`/report-templates/${id}`, { method: "DELETE" });
