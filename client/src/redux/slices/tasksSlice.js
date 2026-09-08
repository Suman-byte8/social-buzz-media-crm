import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchTasks as fetchTasksApi,
  fetchTasksByAssignee as fetchTasksByAssigneeApi,
  fetchTasksByClient as fetchTasksByClientApi,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from "@/services/taskService";

// Tasks change more often than clients/team, so a shorter TTL — still
// enough to collapse redundant fetches from rapid tab-switching/re-renders
// without serving noticeably stale board state.
const TASKS_TTL_MS = 2 * 60 * 1000;

export const fetchTasks = createCachedThunk("tasks/fetchTasks", fetchTasksApi, { ttlMs: TASKS_TTL_MS });

export const fetchTasksByAssignee = createCachedThunk("tasks/fetchTasksByAssignee", fetchTasksByAssigneeApi, {
  ttlMs: TASKS_TTL_MS,
});

export const fetchTasksByClient = createCachedThunk("tasks/fetchTasksByClient", fetchTasksByClientApi, {
  ttlMs: TASKS_TTL_MS,
});

// A task's status/assignees/client can shift which cached list it belongs
// in, so a mutation invalidates all three task caches rather than trying
// to guess which ones it affected.
const invalidateTaskCaches = () => {
  invalidateCache("tasks/fetchTasks");
  invalidateCache("tasks/fetchTasksByAssignee");
  invalidateCache("tasks/fetchTasksByClient");
};

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      const result = await createTaskApi(taskData);
      invalidateTaskCaches();
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create task");
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, taskData }, { rejectWithValue }) => {
    try {
      const result = await updateTaskApi(id, taskData);
      invalidateTaskCaches();
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update task");
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, { rejectWithValue }) => {
    try {
      await deleteTaskApi(id);
      invalidateTaskCaches();
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete task");
    }
  }
);

const initialState = {
  tasks: [],
  // Populated by fetchTasksByAssignee — kept separate from `tasks` so a
  // member-profile lookup never clobbers the site-wide task list other
  // pages (Tasks board, Dashboard) are reading from the same store.
  memberTasks: [],
  // Populated by fetchTasksByClient — kept separate for the same reason
  // as memberTasks above (used by the client profile's Recent Activity).
  clientTasks: [],
  loading: false,
  loadingMemberTasks: false,
  loadingClientTasks: false,
  error: null,
  successMessage: null,
  // Keyed by id — see deleteTask's optimistic-update reducers below.
  pendingDeleteSnapshots: {},
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setTaskStatusLocal: (state, action) => {
      const { id, status } = action.payload;
      const task = state.tasks.find((t) => t.id === id);
      if (task) task.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.data || [];
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tasks";
      })
      .addCase(fetchTasksByAssignee.pending, (state) => {
        state.loadingMemberTasks = true;
      })
      .addCase(fetchTasksByAssignee.fulfilled, (state, action) => {
        state.loadingMemberTasks = false;
        state.memberTasks = action.payload?.data || action.payload || [];
      })
      .addCase(fetchTasksByAssignee.rejected, (state, action) => {
        state.loadingMemberTasks = false;
        state.error = action.payload || "Failed to fetch member tasks";
      })
      .addCase(fetchTasksByClient.pending, (state) => {
        state.loadingClientTasks = true;
      })
      .addCase(fetchTasksByClient.fulfilled, (state, action) => {
        state.loadingClientTasks = false;
        state.clientTasks = action.payload?.data || action.payload || [];
      })
      .addCase(fetchTasksByClient.rejected, (state, action) => {
        state.loadingClientTasks = false;
        state.error = action.payload || "Failed to fetch client tasks";
      })
      .addCase(createTask.fulfilled, (state) => {
        state.successMessage = "Task created successfully";
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to create task";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.tasks.findIndex((t) => t.id === updated.id);
          if (idx !== -1) state.tasks[idx] = updated;
          const memberIdx = state.memberTasks.findIndex((t) => t.id === updated.id);
          if (memberIdx !== -1) state.memberTasks[memberIdx] = updated;
        }
        state.successMessage = "Task updated successfully";
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to update task";
      })
      .addCase(deleteTask.pending, (state, action) => {
        state.error = null;
        const id = action.meta.arg;
        const idx = state.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          state.pendingDeleteSnapshots[id] = state.tasks[idx];
          state.tasks.splice(idx, 1);
        }
        state.memberTasks = state.memberTasks.filter((t) => t.id !== id);
        state.clientTasks = state.clientTasks.filter((t) => t.id !== id);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        delete state.pendingDeleteSnapshots[action.payload];
        state.successMessage = "Task deleted successfully";
      })
      .addCase(deleteTask.rejected, (state, action) => {
        const id = action.meta.arg;
        const snapshot = state.pendingDeleteSnapshots[id];
        if (snapshot) {
          state.tasks.push(snapshot);
          delete state.pendingDeleteSnapshots[id];
        }
        state.error = action.payload || "Failed to delete task";
      });
  },
});

export const { clearMessages, setTaskStatusLocal } = tasksSlice.actions;
export default tasksSlice.reducer;
