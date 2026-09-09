import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchNotifications as fetchNotificationsApi,
  fetchUnreadCount as fetchUnreadCountApi,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  deleteNotification as deleteNotificationApi,
  clearAllNotifications as clearAllNotificationsApi,
} from "@/services/notificationService";

// Not cached (unlike most other GET-list thunks) — freshness matters more
// than saving a request here: the bell badge and the notifications page
// should always reflect the real unread count, not a stale localStorage
// snapshot from a few minutes ago.
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchNotificationsApi(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch notifications");
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchUnreadCountApi();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch unread count");
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id, { rejectWithValue }) => {
    try {
      await markNotificationReadApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to mark as read");
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsReadApi();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to mark all as read");
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteNotificationApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete notification");
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAll",
  async (_, { rejectWithValue }) => {
    try {
      await clearAllNotificationsApi();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to clear notifications");
    }
  }
);

const initialState = {
  notifications: [],
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Called by NotificationBridge (already holding the one live socket
    // connection) when a "notification" event arrives, so the bell badge
    // and an open Notifications page (on page 1) update instantly instead
    // of waiting for the next poll/navigation.
    receiveLiveNotification: (state, action) => {
      if (state.currentPage === 1) {
        state.notifications.unshift(action.payload);
        state.totalItems += 1;
      }
      state.unreadCount += 1;
    },
    clearNotificationsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data || [];
        state.totalPages = action.payload.pagination?.totalPages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
        state.totalItems = action.payload.pagination?.total || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch notifications";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload?.count || 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.notifications.find((n) => n.id === action.payload);
        if (notif && !notif.read) {
          notif.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const idx = state.notifications.findIndex((n) => n.id === action.payload);
        if (idx !== -1) {
          if (!state.notifications[idx].read) state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.notifications.splice(idx, 1);
          state.totalItems = Math.max(0, state.totalItems - 1);
        }
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.totalItems = 0;
        state.totalPages = 1;
        state.unreadCount = 0;
      });
  },
});

export const { receiveLiveNotification, clearNotificationsError } = notificationsSlice.actions;
export default notificationsSlice.reducer;
