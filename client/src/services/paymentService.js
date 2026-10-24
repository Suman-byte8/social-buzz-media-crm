import { apiClient } from "./apiClient";

// ── Overview / client table ─────────────────────────────────────────────

export const fetchPaymentsOverview = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);
  const qs = query.toString();
  return apiClient(`/payments/overview${qs ? `?${qs}` : ""}`);
};

export const fetchClientPayments = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const qs = query.toString();
  return apiClient(`/payments/clients${qs ? `?${qs}` : ""}`);
};

export const fetchClientPaymentDetail = async (clientId) => apiClient(`/payments/clients/${clientId}`);

// ── Billing configuration ───────────────────────────────────────────────

export const fetchBillingConfig = async (clientId) => apiClient(`/billing-config/${clientId}`);
export const createBillingConfig = async (clientId, payload) => apiClient(`/billing-config/${clientId}`, { method: "POST", body: payload });
export const updateBillingConfig = async (clientId, payload) => apiClient(`/billing-config/${clientId}`, { method: "PUT", body: payload });

// ── Invoices ─────────────────────────────────────────────────────────────

export const fetchInvoices = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const qs = query.toString();
  return apiClient(`/invoices${qs ? `?${qs}` : ""}`);
};

export const fetchOutstandingInvoices = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const qs = query.toString();
  return apiClient(`/invoices/outstanding${qs ? `?${qs}` : ""}`);
};

export const fetchInvoice = async (id) => apiClient(`/invoices/${id}`);
export const createInvoice = async (payload) => apiClient("/invoices", { method: "POST", body: payload });
export const updateInvoice = async (id, payload) => apiClient(`/invoices/${id}`, { method: "PUT", body: payload });
export const issueInvoice = async (id) => apiClient(`/invoices/${id}/issue`, { method: "POST" });
export const voidInvoice = async (id, reason) => apiClient(`/invoices/${id}/void`, { method: "POST", body: { reason } });
export const duplicateInvoice = async (id) => apiClient(`/invoices/${id}/duplicate`, { method: "POST" });

export const exportInvoicePdf = async (id, pdfBlob, fileNameBase) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, `${fileNameBase}.pdf`);
  return apiClient(`/invoices/${id}/export-pdf`, { method: "POST", body: formData });
};

// ── Recurring billing ────────────────────────────────────────────────────

export const previewRecurringInvoices = async (body = {}) => apiClient("/billing/recurring/preview", { method: "POST", body });
export const generateRecurringInvoices = async (body = {}) => apiClient("/billing/recurring/generate", { method: "POST", body });

// ── Payments ─────────────────────────────────────────────────────────────

export const recordPayment = async (payload) => apiClient("/payments", { method: "POST", body: payload });
export const reversePayment = async (id, reason) => apiClient(`/payments/${id}/reverse`, { method: "POST", body: { reason } });

export const exportReceiptPdf = async (paymentId, pdfBlob, fileNameBase) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, `${fileNameBase}.pdf`);
  return apiClient(`/payments/${paymentId}/export-receipt-pdf`, { method: "POST", body: formData });
};

// ── Advances / refunds ───────────────────────────────────────────────────

export const applyAdvance = async (payload) => apiClient("/advances/apply", { method: "POST", body: payload });
export const recordRefund = async (payload) => apiClient("/refunds", { method: "POST", body: payload });

// ── Reminders ────────────────────────────────────────────────────────────

export const createReminder = async (payload) => apiClient("/reminders", { method: "POST", body: payload });
export const completeReminder = async (id) => apiClient(`/reminders/${id}/complete`, { method: "PUT" });
export const fetchReminderDraftText = async (invoiceId) => apiClient(`/reminders/draft-text/${invoiceId}`);

// ── Activity ─────────────────────────────────────────────────────────────

export const fetchPaymentActivity = async (clientId) => apiClient(`/payments/activity/${clientId}`);

// ── Reports / export ─────────────────────────────────────────────────────

export const exportPaymentsReport = async (report, { format = "csv", ...params } = {}) => {
  const query = new URLSearchParams({ format, ...params });
  return apiClient(`/payments/export/${report}?${query.toString()}`, { responseType: "blob" });
};
