import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchPaymentsOverview as fetchPaymentsOverviewApi,
  fetchClientPayments as fetchClientPaymentsApi,
  fetchClientPaymentDetail as fetchClientPaymentDetailApi,
} from "@/services/paymentService";

// Mirrors agreementsSlice.js's split: this slice only covers the dashboard's
// list/overview surface. Everything else (invoice/payment mutations, the
// drawer's own sub-tabs) is called directly from components via
// paymentService.js and re-fetches the detail payload afterward — a fast-
// changing financial drawer re-rendering the whole store on every edit is
// the same performance problem the Agreement/Proposal/Report editors avoid
// by keeping their own live documents out of Redux entirely.

const TTL_MS = 60 * 1000;

export const fetchPaymentsOverview = createCachedThunk("payments/fetchOverview", fetchPaymentsOverviewApi, {
  ttlMs: TTL_MS,
  getCacheKey: (params) => JSON.stringify(params || {}),
});

export const fetchClientPayments = createCachedThunk("payments/fetchClientPayments", fetchClientPaymentsApi, {
  ttlMs: TTL_MS,
  getCacheKey: (params) => JSON.stringify(params || {}),
});

export const fetchClientPaymentDetail = createAsyncThunk("payments/fetchClientPaymentDetail", async (clientId, { rejectWithValue }) => {
  try {
    return await fetchClientPaymentDetailApi(clientId);
  } catch (error) {
    return rejectWithValue(error.message || "Failed to load client payment detail");
  }
});

// Called by components after any mutation (invoice created, payment
// recorded, advance applied, ...) so the next overview/table fetch reflects
// it instead of serving a stale cached response.
export const invalidatePaymentsCaches = () => {
  invalidateCache("payments/fetchOverview");
  invalidateCache("payments/fetchClientPayments");
};

const initialState = {
  overview: null,
  loadingOverview: false,
  clients: [],
  pagination: { total: 0, page: 1, limit: 24, totalPages: 1 },
  loadingClients: false,
  clientDetail: null,
  loadingClientDetail: false,
  error: null,
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPaymentsError: (state) => {
      state.error = null;
    },
    clearClientDetail: (state) => {
      state.clientDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentsOverview.pending, (state) => {
        state.loadingOverview = true;
      })
      .addCase(fetchPaymentsOverview.fulfilled, (state, action) => {
        state.loadingOverview = false;
        state.overview = action.payload.data;
      })
      .addCase(fetchPaymentsOverview.rejected, (state, action) => {
        state.loadingOverview = false;
        state.error = action.payload || "Failed to fetch payments overview";
      })
      .addCase(fetchClientPayments.pending, (state) => {
        state.loadingClients = true;
      })
      .addCase(fetchClientPayments.fulfilled, (state, action) => {
        state.loadingClients = false;
        state.clients = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchClientPayments.rejected, (state, action) => {
        state.loadingClients = false;
        state.error = action.payload || "Failed to fetch client payments";
      })
      .addCase(fetchClientPaymentDetail.pending, (state) => {
        state.loadingClientDetail = true;
      })
      .addCase(fetchClientPaymentDetail.fulfilled, (state, action) => {
        state.loadingClientDetail = false;
        state.clientDetail = action.payload.data;
      })
      .addCase(fetchClientPaymentDetail.rejected, (state, action) => {
        state.loadingClientDetail = false;
        state.error = action.payload || "Failed to fetch client payment detail";
      });
  },
});

export const { clearPaymentsError, clearClientDetail } = paymentsSlice.actions;
export default paymentsSlice.reducer;
