import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchServices as fetchServicesApi,
  createService as createServiceApi,
  updateService as updateServiceApi,
  deleteService as deleteServiceApi,
} from "@/services/serviceService";

// Plain thunks, no TTL cache — this list is short, rarely fetched more than
// once per page load, and needs to reflect an add/edit/delete immediately
// both in the Settings management card and in AddEditClientModal's picker.

export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchServicesApi();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch services");
    }
  }
);

export const createService = createAsyncThunk(
  "services/createService",
  async (serviceData, { rejectWithValue }) => {
    try {
      const response = await createServiceApi(serviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create service");
    }
  }
);

export const updateService = createAsyncThunk(
  "services/updateService",
  async ({ id, serviceData }, { rejectWithValue }) => {
    try {
      const response = await updateServiceApi(id, serviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update service");
    }
  }
);

export const deleteService = createAsyncThunk(
  "services/deleteService",
  async (id, { rejectWithValue }) => {
    try {
      await deleteServiceApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete service");
    }
  }
);

const initialState = {
  services: [],
  loading: false,
  error: null,
  successMessage: null,
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch services";
      })
      .addCase(createService.fulfilled, (state, action) => {
        if (action.payload) state.services.push(action.payload);
        state.services.sort((a, b) => a.name.localeCompare(b.name));
        state.successMessage = "Service added successfully";
      })
      .addCase(createService.rejected, (state, action) => {
        state.error = action.payload || "Failed to create service";
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const idx = state.services.findIndex((s) => s.id === updated.id);
          if (idx !== -1) state.services[idx] = updated;
          state.services.sort((a, b) => a.name.localeCompare(b.name));
        }
        state.successMessage = "Service updated successfully";
      })
      .addCase(updateService.rejected, (state, action) => {
        state.error = action.payload || "Failed to update service";
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.services = state.services.filter((s) => s.id !== action.payload);
        state.successMessage = "Service deleted successfully";
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete service";
      });
  },
});

export const { clearMessages } = servicesSlice.actions;
export default servicesSlice.reducer;
