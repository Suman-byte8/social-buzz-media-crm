import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchContentCalendarEntries as fetchContentCalendarEntriesApi,
  createContentCalendarEntry as createContentCalendarEntryApi,
  updateContentCalendarEntry as updateContentCalendarEntryApi,
  deleteContentCalendarEntry as deleteContentCalendarEntryApi,
  uploadCreatives as uploadCreativesApi,
  deleteCreative as deleteCreativeApi,
} from "@/services/contentCalendarService";

export const fetchContentCalendarEntries = createAsyncThunk(
  "contentCalendar/fetchEntries",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await fetchContentCalendarEntriesApi(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch content calendar entries");
    }
  }
);

export const createContentCalendarEntry = createAsyncThunk(
  "contentCalendar/createEntry",
  async (data, { rejectWithValue }) => {
    try {
      return await createContentCalendarEntryApi(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create entry");
    }
  }
);

export const updateContentCalendarEntry = createAsyncThunk(
  "contentCalendar/updateEntry",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateContentCalendarEntryApi(id, data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update entry");
    }
  }
);

export const deleteContentCalendarEntry = createAsyncThunk(
  "contentCalendar/deleteEntry",
  async (id, { rejectWithValue }) => {
    try {
      await deleteContentCalendarEntryApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete entry");
    }
  }
);

export const uploadCreatives = createAsyncThunk(
  "contentCalendar/uploadCreatives",
  async ({ entryId, files }, { rejectWithValue }) => {
    try {
      return await uploadCreativesApi(entryId, files);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload creatives");
    }
  }
);

export const deleteCreative = createAsyncThunk(
  "contentCalendar/deleteCreative",
  async ({ entryId, fileId }, { rejectWithValue }) => {
    try {
      await deleteCreativeApi(entryId, fileId);
      return { entryId, fileId };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to remove creative");
    }
  }
);

const initialState = {
  entries: [],
  loading: false,
  error: null,
  successMessage: null,
};

const contentCalendarSlice = createSlice({
  name: "contentCalendar",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setEntryStatusLocal: (state, action) => {
      const { id, status } = action.payload;
      const entry = state.entries.find((e) => e.id === id);
      if (entry) entry.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContentCalendarEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentCalendarEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data || [];
      })
      .addCase(fetchContentCalendarEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch content calendar entries";
      })
      .addCase(createContentCalendarEntry.fulfilled, (state) => {
        state.successMessage = "Entry created successfully";
      })
      .addCase(createContentCalendarEntry.rejected, (state, action) => {
        state.error = action.payload || "Failed to create entry";
      })
      .addCase(updateContentCalendarEntry.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.entries.findIndex((e) => e.id === updated.id);
          if (idx !== -1) state.entries[idx] = updated;
        }
        state.successMessage = "Entry updated successfully";
      })
      .addCase(updateContentCalendarEntry.rejected, (state, action) => {
        state.error = action.payload || "Failed to update entry";
      })
      .addCase(deleteContentCalendarEntry.fulfilled, (state, action) => {
        state.entries = state.entries.filter((e) => e.id !== action.payload);
        state.successMessage = "Entry deleted successfully";
      })
      .addCase(deleteContentCalendarEntry.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete entry";
      })
      .addCase(uploadCreatives.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload creatives";
      })
      .addCase(deleteCreative.fulfilled, (state, action) => {
        const { entryId, fileId } = action.payload;
        const entry = state.entries.find((e) => e.id === entryId);
        if (entry?.creatives) {
          entry.creatives = entry.creatives.filter((c) => c.fileId !== fileId);
        }
      })
      .addCase(deleteCreative.rejected, (state, action) => {
        state.error = action.payload || "Failed to remove creative";
      });
  },
});

export const { clearMessages, setEntryStatusLocal } = contentCalendarSlice.actions;
export default contentCalendarSlice.reducer;
