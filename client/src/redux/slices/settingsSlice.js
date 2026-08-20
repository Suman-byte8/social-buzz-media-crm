import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getGeneralSettings,
  updateGeneralSettings,
  uploadAgencyLogo,
} from "@/services/settingsService";
import { saveToStorage, getFromStorage } from "@/utils/storage";

const SETTINGS_STORAGE_KEY = "general_settings";

// Fetch settings async thunk
export const fetchSettings = createAsyncThunk(
  "settings/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getGeneralSettings();
      saveToStorage(SETTINGS_STORAGE_KEY, data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch settings");
    }
  },
);

// Update settings async thunk
export const saveSettings = createAsyncThunk(
  "settings/saveSettings",
  async (settingsData, { rejectWithValue }) => {
    try {
      const updatedData = await updateGeneralSettings(settingsData);
      saveToStorage(SETTINGS_STORAGE_KEY, updatedData);
      return updatedData;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update settings");
    }
  },
);

// Upload logo async thunk
export const uploadLogo = createAsyncThunk(
  "settings/uploadLogo",
  async (file, { rejectWithValue }) => {
    try {
      const result = await uploadAgencyLogo(file);
      const updatedData = result.data || { logo: result.logoUrl };
      saveToStorage(SETTINGS_STORAGE_KEY, updatedData);
      return result;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to upload logo to Google Drive",
      );
    }
  },
);

const initialState = {
  data: getFromStorage(SETTINGS_STORAGE_KEY) || {
    logo: "",
    name: "",
    email: "",
    website: "",
    address: "",
    gstNumber: "",
    password: "",
  },
  loading: false,
  uploadingLogo: false,
  error: null,
  successMessage: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.data[field] = value;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Settings
      .addCase(saveSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
        state.successMessage = "Agency general settings updated successfully!";
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload Logo
      .addCase(uploadLogo.pending, (state) => {
        state.uploadingLogo = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(uploadLogo.fulfilled, (state, action) => {
        state.uploadingLogo = false;
        if (action.payload.logoUrl) {
          state.data.logo = action.payload.logoUrl;
        }
        state.successMessage =
          "Logo uploaded to Google Drive and saved successfully!";
      })
      .addCase(uploadLogo.rejected, (state, action) => {
        state.uploadingLogo = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, updateField } = settingsSlice.actions;
export default settingsSlice.reducer;
