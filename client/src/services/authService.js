import { apiClient } from "./apiClient";

export const fetchUsers = async () => apiClient("/auth/users");

export const revealUserPassword = async (id) => apiClient(`/auth/users/${id}/password`);

export const updateUserPassword = async (id, password) =>
  apiClient(`/auth/users/${id}/password`, {
    method: "PUT",
    body: { password },
  });
