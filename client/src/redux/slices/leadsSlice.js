import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchLeads as fetchLeadsApi,
  fetchLeadMetrics as fetchLeadMetricsApi,
  createLead as createLeadApi,
  updateLead as updateLeadApi,
  deleteLead as deleteLeadApi,
  convertLead as convertLeadApi,
} from "@/services/leadService";

const LEADS_TTL_MS = 3 * 60 * 1000;

const invalidateLeadCaches = () => {
  invalidateCache("leads/fetchLeads");
  invalidateCache("leads/fetchLeadMetrics");
};

export const fetchLeads = createCachedThunk("leads/fetchLeads", fetchLeadsApi, { ttlMs: LEADS_TTL_MS });

export const fetchLeadMetrics = createCachedThunk("leads/fetchLeadMetrics", fetchLeadMetricsApi, {
  ttlMs: LEADS_TTL_MS,
});

export const createLead = createAsyncThunk(
  "leads/createLead",
  async (leadData, { rejectWithValue }) => {
    try {
      const result = await createLeadApi(leadData);
      invalidateLeadCaches();
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create lead");
    }
  }
);

export const updateLead = createAsyncThunk(
  "leads/updateLead",
  async ({ id, leadData }, { rejectWithValue }) => {
    try {
      const result = await updateLeadApi(id, leadData);
      invalidateLeadCaches();
      return result;
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
      invalidateLeadCaches();
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
      const result = await convertLeadApi(id);
      invalidateLeadCaches();
      // Converting a lead creates a new client, so the clients cache needs
      // to drop too or the new client won't show up until it expires.
      invalidateCache("clients/fetchClients");
      return result;
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
  // Keyed by id — see deleteLead/convertLead's optimistic-update reducers.
  pendingRemovalSnapshots: {},
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
      .addCase(deleteLead.pending, (state, action) => {
        state.error = null;
        const id = action.meta.arg;
        const idx = state.leads.findIndex((l) => l.id === id);
        if (idx !== -1) {
          state.pendingRemovalSnapshots[id] = { item: state.leads[idx], index: idx };
          state.leads.splice(idx, 1);
        }
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        delete state.pendingRemovalSnapshots[action.payload];
        state.successMessage = "Lead deleted successfully";
        state.error = null;
      })
      .addCase(deleteLead.rejected, (state, action) => {
        const id = action.meta.arg;
        const snapshot = state.pendingRemovalSnapshots[id];
        if (snapshot) {
          state.leads.splice(Math.min(snapshot.index, state.leads.length), 0, snapshot.item);
          delete state.pendingRemovalSnapshots[id];
        }
        state.error = action.payload || "Failed to delete lead";
      })
      .addCase(convertLead.pending, (state, action) => {
        state.error = null;
        const id = action.meta.arg;
        const idx = state.leads.findIndex((l) => l.id === id);
        if (idx !== -1) {
          state.pendingRemovalSnapshots[id] = { item: state.leads[idx], index: idx };
          state.leads.splice(idx, 1);
        }
      })
      .addCase(convertLead.fulfilled, (state, action) => {
        delete state.pendingRemovalSnapshots[action.meta.arg];
        state.successMessage = "Lead converted to client successfully";
        state.error = null;
      })
      .addCase(convertLead.rejected, (state, action) => {
        const id = action.meta.arg;
        const snapshot = state.pendingRemovalSnapshots[id];
        if (snapshot) {
          state.leads.splice(Math.min(snapshot.index, state.leads.length), 0, snapshot.item);
          delete state.pendingRemovalSnapshots[id];
        }
        state.error = action.payload || "Failed to convert lead";
      });
  },
});

export const { clearMessages } = leadsSlice.actions;
export default leadsSlice.reducer;
