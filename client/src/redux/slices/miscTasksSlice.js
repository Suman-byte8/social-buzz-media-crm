import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchMiscTasks as fetchMiscTasksApi,
  saveMiscTask as saveMiscTaskApi,
  updateMiscTask as updateMiscTaskApi,
  deleteMiscTask as deleteMiscTaskApi,
} from "@/services/miscTaskService";

export const fetchMiscTasks = createAsyncThunk(
  "miscTasks/fetch",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchMiscTasksApi(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);

export const saveMiscTask = createAsyncThunk(
  "miscTasks/save",
  async (formData, { rejectWithValue }) => {
    try {
      return await saveMiscTaskApi(formData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save task");
    }
  }
);

export const updateMiscTask = createAsyncThunk(
  "miscTasks/update",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      return await updateMiscTaskApi(id, updateData);
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
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete task");
    }
  }
);

const initialState = {
  miscTasks: [],
  loading: false,
  error: null,
  successMessage: null,
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
      .addCase(deleteMiscTask.fulfilled, (state, action) => {
        state.miscTasks = state.miscTasks.filter((t) => t.id !== action.payload);
        state.successMessage = "Task deleted successfully";
      })
      .addCase(deleteMiscTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete task";
      });
  },
});

export const { clearMessages } = miscTasksSlice.actions;
export default miscTasksSlice.reducer;
