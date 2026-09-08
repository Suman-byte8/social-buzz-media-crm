import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchMiscTasks as fetchMiscTasksApi,
  saveMiscTask as saveMiscTaskApi,
  updateMiscTask as updateMiscTaskApi,
  deleteMiscTask as deleteMiscTaskApi,
} from "@/services/miscTaskService";

export const fetchMiscTasks = createCachedThunk("miscTasks/fetch", fetchMiscTasksApi, { ttlMs: 3 * 60 * 1000 });

export const saveMiscTask = createAsyncThunk(
  "miscTasks/save",
  async (formData, { rejectWithValue }) => {
    try {
      const result = await saveMiscTaskApi(formData);
      invalidateCache("miscTasks/fetch");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save task");
    }
  }
);

export const updateMiscTask = createAsyncThunk(
  "miscTasks/update",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const result = await updateMiscTaskApi(id, updateData);
      invalidateCache("miscTasks/fetch");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update task");
    }
  }
);

export const deleteMiscTask = createAsyncThunk(
  "miscTasks/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteMiscTaskApi(id);
      invalidateCache("miscTasks/fetch");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete task");
    }
  }
);

const initialState = {
  miscTasks: [],
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  loading: false,
  error: null,
  successMessage: null,
  // Keyed by id — see deleteMiscTask's optimistic-update reducers below.
  pendingDeleteSnapshots: {},
};

const miscTasksSlice = createSlice({
  name: "miscTasks",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMiscTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMiscTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.miscTasks = action.payload.data || [];
        state.totalPages = action.payload.pagination?.totalPages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
        state.totalItems = action.payload.pagination?.total || action.payload.data?.length || 0;
      })
      .addCase(fetchMiscTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tasks";
      })
      .addCase(saveMiscTask.fulfilled, (state, action) => {
        const task = action.payload?.data;
        if (task) {
          const idx = state.miscTasks.findIndex((t) => t.id === task.id);
          if (idx !== -1) state.miscTasks[idx] = task;
          else state.miscTasks.unshift(task);
        }
        state.successMessage = "Task saved successfully";
      })
      .addCase(saveMiscTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to save task";
      })
      .addCase(updateMiscTask.fulfilled, (state, action) => {
        const task = action.payload?.data;
        if (task?.id) {
          const idx = state.miscTasks.findIndex((t) => t.id === task.id);
          if (idx !== -1) state.miscTasks[idx] = task;
        }
        state.successMessage = "Task updated successfully";
      })
      .addCase(updateMiscTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to update task";
      })
      .addCase(deleteMiscTask.pending, (state, action) => {
        state.error = null;
        const id = action.meta.arg;
        const idx = state.miscTasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          state.pendingDeleteSnapshots[id] = { item: state.miscTasks[idx], index: idx };
          state.miscTasks.splice(idx, 1);
        }
      })
      .addCase(deleteMiscTask.fulfilled, (state, action) => {
        delete state.pendingDeleteSnapshots[action.payload];
        state.successMessage = "Task deleted successfully";
      })
      .addCase(deleteMiscTask.rejected, (state, action) => {
        const id = action.meta.arg;
        const snapshot = state.pendingDeleteSnapshots[id];
        if (snapshot) {
          state.miscTasks.splice(Math.min(snapshot.index, state.miscTasks.length), 0, snapshot.item);
          delete state.pendingDeleteSnapshots[id];
        }
        state.error = action.payload || "Failed to delete task";
      });
  },
});

export const { clearMessages } = miscTasksSlice.actions;
export default miscTasksSlice.reducer;
