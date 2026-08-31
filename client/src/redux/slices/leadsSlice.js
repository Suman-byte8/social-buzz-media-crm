import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchLeads as fetchLeadsApi,
  fetchLeadMetrics as fetchLeadMetricsApi,
  createLead as createLeadApi,
  updateLead as updateLeadApi,
  deleteLead as deleteLeadApi,
  convertLead as convertLeadApi,
} from "@/services/leadService";

export const fetchLeads = createAsyncThunk(
  "leads/fetchLeads",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await fetchLeadsApi(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch leads");
    }
  }
);

export const fetchLeadMetrics = createAsyncThunk(
  "leads/fetchLeadMetrics",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchLeadMetricsApi();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch lead metrics");
    }
  }
);

export const createLead = createAsyncThunk(
  "leads/createLead",
  async (leadData, { rejectWithValue }) => {
    try {
      return await createLeadApi(leadData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create lead");
    }
  }
);

export const updateLead = createAsyncThunk(
  "leads/updateLead",
  async ({ id, leadData }, { rejectWithValue }) => {
    try {
      return await updateLeadApi(id, leadData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update lead");
    }
  }
);

export const deleteLead = createAsyncThunk(
  "leads/deleteLead",
  async (id, { rejectWithValue }) => {
    try {
      await deleteLeadApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete lead");
    }
  }
);

export const convertLead = createAsyncThunk(
  "leads/convertLead",
  async (id, { rejectWithValue }) => {
    try {
      return await convertLeadApi(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to convert lead");
    }
  }
);

const initialState = {
  leads: [],
  loading: false,
  error: null,
  successMessage: null,
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  metrics: { totalLeads: 0, hotProspects: 0, followUpDue: 0, lostThisMonth: 0, newThisMonth: 0 },
  loadingMetrics: false,
};

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.data;
        state.totalPages = action.payload.pagination?.totalPages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
        state.totalItems = action.payload.pagination?.total || 0;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch leads";
      })
      .addCase(fetchLeadMetrics.pending, (state) => {
        state.loadingMetrics = true;
      })
      .addCase(fetchLeadMetrics.fulfilled, (state, action) => {
        state.loadingMetrics = false;
        state.metrics = action.payload.data;
      })
      .addCase(fetchLeadMetrics.rejected, (state) => {
        state.loadingMetrics = false;
      })
      .addCase(createLead.fulfilled, (state) => {
        state.successMessage = "Lead created successfully";
        state.error = null;
      })
      .addCase(createLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to create lead";
      })
      .addCase(updateLead.fulfilled, (state) => {
        state.successMessage = "Lead updated successfully";
        state.error = null;
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to update lead";
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((l) => l.id !== action.payload);
        state.successMessage = "Lead deleted successfully";
        state.error = null;
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete lead";
      })
      .addCase(convertLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((l) => l.id !== action.meta.arg);
        state.successMessage = "Lead converted to client successfully";
        state.error = null;
      })
      .addCase(convertLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to convert lead";
      });
  },
});

export const { clearMessages } = leadsSlice.actions;
export default leadsSlice.reducer;
