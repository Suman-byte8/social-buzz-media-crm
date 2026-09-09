import { apiClient } from "./apiClient";

export const fetchNotifications = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiClient(`/notifications?${queryString}`);
};

export const fetchUnreadCount = async () => apiClient("/notifications/unread-count");

export const markNotificationRead = async (id) => apiClient(`/notifications/${id}/read`, { method: "PUT" });

export const markAllNotificationsRead = async () => apiClient("/notifications/read-all", { method: "PUT" });

export const deleteNotification = async (id) => apiClient(`/notifications/${id}`, { method: "DELETE" });

export const clearAllNotifications = async () => apiClient("/notifications", { method: "DELETE" });
