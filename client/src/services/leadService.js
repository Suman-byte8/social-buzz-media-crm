import { apiClient } from "./apiClient";

export const fetchLeads = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiClient(`/leads?${queryString}`);
};

export const fetchLeadMetrics = async () => {
  return apiClient("/leads/metrics");
};

export const createLead = async (leadData) => {
  return apiClient("/leads", { method: "POST", body: leadData });
};

export const updateLead = async (id, leadData) => {
  return apiClient(`/leads/${id}`, { method: "PUT", body: leadData });
};

export const deleteLead = async (id) => {
  return apiClient(`/leads/${id}`, { method: "DELETE" });
};

export const convertLead = async (id) => {
  return apiClient(`/leads/${id}/convert`, { method: "POST" });
};
