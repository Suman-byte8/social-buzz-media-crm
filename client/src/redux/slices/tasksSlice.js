import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchTasks as fetchTasksApi,
  fetchTasksByAssignee as fetchTasksByAssigneeApi,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from "@/services/taskService";

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await fetchTasksApi(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);

export const fetchTasksByAssignee = createAsyncThunk(
  "tasks/fetchTasksByAssignee",
  async (assigneeId, { rejectWithValue }) => {
    try {
      return await fetchTasksByAssigneeApi(assigneeId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      return await createTaskApi(taskData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create task");
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, taskData }, { rejectWithValue }) => {
    try {
      return await updateTaskApi(id, taskData);
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
  loading: false,
  loadingMemberTasks: false,
  error: null,
  successMessage: null,
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
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        state.memberTasks = state.memberTasks.filter((t) => t.id !== action.payload);
        state.successMessage = "Task deleted successfully";
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete task";
      });
  },
});

export const { clearMessages, setTaskStatusLocal } = tasksSlice.actions;
export default tasksSlice.reducer;
