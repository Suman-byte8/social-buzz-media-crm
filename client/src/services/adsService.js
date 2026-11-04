import { apiClient } from "./apiClient";

const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

// platform: "google_ads" | "meta"; from/to: inclusive YYYY-MM-DD
export const fetchClientAdsSummary = async (clientId, { platform, from, to }) =>
  apiClient(`/ads/clients/${clientId}/summary${toQuery({ platform, from, to })}`);

export const fetchAdsStatus = async () => apiClient("/ads/status");
export const fetchAdsOverview = async (params = {}) => apiClient(`/ads/overview${toQuery(params)}`);
export const fetchAdAccounts = async () => apiClient("/ads/accounts");
export const updateAdAccount = async (id, payload) => apiClient(`/ads/accounts/${id}`, { method: "PUT", body: payload });
export const syncAdsNow = async (payload = {}) => apiClient("/ads/sync", { method: "POST", body: payload });
export const subscribeMetaPages = async () => apiClient("/ads/meta/subscribe-pages", { method: "POST" });
