import { apiClient } from "./apiClient";

export const fetchServices = async () => {
  return apiClient("/services");
};

export const createService = async (serviceData) => {
  return apiClient("/services", { method: "POST", body: serviceData });
};

export const updateService = async (id, serviceData) => {
  return apiClient(`/services/${id}`, { method: "PUT", body: serviceData });
};

export const deleteService = async (id) => {
  return apiClient(`/services/${id}`, { method: "DELETE" });
};
