import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchContentCalendarEntries as fetchContentCalendarEntriesApi,
  createContentCalendarEntry as createContentCalendarEntryApi,
  updateContentCalendarEntry as updateContentCalendarEntryApi,
  deleteContentCalendarEntry as deleteContentCalendarEntryApi,
  uploadCreatives as uploadCreativesApi,
  deleteCreative as deleteCreativeApi,
  syncGoogleSheet as syncGoogleSheetApi,
  importCalendarFile as importCalendarFileApi,
  fetchLiveCalendar as fetchLiveCalendarApi,
  saveClientSheetUrl as saveClientSheetUrlApi,
} from "@/services/contentCalendarService";

export const fetchLiveCalendar = createAsyncThunk(
  "contentCalendar/fetchLiveCalendar",
  async ({ clientId, sheetUrl }, { rejectWithValue }) => {
    try {
      return await fetchLiveCalendarApi(clientId, sheetUrl);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch live calendar");
    }
  }
);

export const saveClientSheetUrl = createAsyncThunk(
  "contentCalendar/saveClientSheetUrl",
  async ({ clientId, sheetUrl }, { rejectWithValue }) => {
    try {
      return await saveClientSheetUrlApi({ clientId, sheetUrl });
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save Google Sheet link");
    }
  }
);

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

export const syncGoogleSheet = createAsyncThunk(
  "contentCalendar/syncGoogleSheet",
  async ({ clientId, sheetUrl, clearExisting }, { rejectWithValue }) => {
    try {
      return await syncGoogleSheetApi({ clientId, sheetUrl, clearExisting });
    } catch (error) {
      return rejectWithValue(error.message || "Failed to sync Google Sheet");
    }
  }
);

export const importCalendarFile = createAsyncThunk(
  "contentCalendar/importCalendarFile",
  async ({ clientId, file, clearExisting }, { rejectWithValue }) => {
    try {
      return await importCalendarFileApi({ clientId, file, clearExisting });
    } catch (error) {
      return rejectWithValue(error.message || "Failed to import calendar file");
    }
  }
);

export const fetchClientMonths = createAsyncThunk(
  "contentCalendar/fetchClientMonths",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchClientMonthsApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch client months");
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
  clientMonths: [],
  savedSheetConfig: null,
  loading: false,
  syncingSheet: false,
  importingFile: false,
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
      .addCase(fetchLiveCalendar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveCalendar.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload?.entries || [];
        state.clientMonths = action.payload?.months || [];
        if (action.payload?.sheetUrl) {
          state.savedSheetConfig = {
            ...(state.savedSheetConfig || {}),
            googleSheetUrl: action.payload.sheetUrl,
          };
        }
      })
      .addCase(fetchLiveCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load live calendar";
      })
      .addCase(saveClientSheetUrl.fulfilled, (state, action) => {
        state.savedSheetConfig = {
          ...(state.savedSheetConfig || {}),
          googleSheetUrl: action.payload?.data?.sheetUrl || null,
        };
        state.successMessage = action.payload?.message || "Sheet URL saved";
      })
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
      .addCase(fetchClientMonths.fulfilled, (state, action) => {
        state.clientMonths = action.payload?.data?.months || [];
        state.savedSheetConfig = action.payload?.data?.savedConfig || null;
      })
      .addCase(syncGoogleSheet.pending, (state) => {
        state.syncingSheet = true;
        state.error = null;
      })
      .addCase(syncGoogleSheet.fulfilled, (state, action) => {
        state.syncingSheet = false;
        state.successMessage = action.payload?.message || "Google Sheet synced successfully";
      })
      .addCase(syncGoogleSheet.rejected, (state, action) => {
        state.syncingSheet = false;
        state.error = action.payload || "Failed to sync Google Sheet";
      })
      .addCase(importCalendarFile.pending, (state) => {
        state.importingFile = true;
        state.error = null;
      })
      .addCase(importCalendarFile.fulfilled, (state, action) => {
        state.importingFile = false;
        state.successMessage = action.payload?.message || "File imported successfully";
      })
      .addCase(importCalendarFile.rejected, (state, action) => {
        state.importingFile = false;
        state.error = action.payload || "Failed to import file";
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
