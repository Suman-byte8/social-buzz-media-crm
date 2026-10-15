import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchAgreementDrafts as fetchAgreementDraftsApi,
  createAgreementDraft as createAgreementDraftApi,
  duplicateAgreementDraft as duplicateAgreementDraftApi,
  trashAgreementDraft as trashAgreementDraftApi,
  restoreAgreementDraft as restoreAgreementDraftApi,
  fetchAgreementTemplates as fetchAgreementTemplatesApi,
} from "@/services/agreementService";

// Mirrors reportsSlice.js's split: this slice only covers the dashboard's
// list/CRUD surface. The editor's own live document (the thing someone is
// actively typing into) stays out of Redux entirely — see
// useAgreementEditor.js — same reasoning as the Report Builder: a fast-
// changing document re-rendering the whole store on every keystroke is a
// performance problem plain React state avoids.

const AGREEMENT_DRAFTS_TTL_MS = 2 * 60 * 1000;

export const fetchAgreementDrafts = createCachedThunk("agreements/fetchAgreementDrafts", fetchAgreementDraftsApi, {
  ttlMs: AGREEMENT_DRAFTS_TTL_MS,
  getCacheKey: (params) => JSON.stringify(params || {}),
});

export const createAgreementDraft = createAsyncThunk("agreements/createAgreementDraft", async (payload, { rejectWithValue }) => {
  try {
    const result = await createAgreementDraftApi(payload);
    invalidateCache("agreements/fetchAgreementDrafts");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to create agreement");
  }
});

export const duplicateAgreementDraft = createAsyncThunk("agreements/duplicateAgreementDraft", async (id, { rejectWithValue }) => {
  try {
    const result = await duplicateAgreementDraftApi(id);
    invalidateCache("agreements/fetchAgreementDrafts");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to duplicate agreement");
  }
});

export const trashAgreementDraft = createAsyncThunk("agreements/trashAgreementDraft", async (id, { rejectWithValue }) => {
  try {
    await trashAgreementDraftApi(id);
    invalidateCache("agreements/fetchAgreementDrafts");
    return id;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to move agreement to trash");
  }
});

export const restoreAgreementDraft = createAsyncThunk("agreements/restoreAgreementDraft", async (id, { rejectWithValue }) => {
  try {
    const result = await restoreAgreementDraftApi(id);
    invalidateCache("agreements/fetchAgreementDrafts");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to restore agreement");
  }
});

export const fetchAgreementTemplates = createCachedThunk("agreements/fetchAgreementTemplates", fetchAgreementTemplatesApi, {
  ttlMs: 5 * 60 * 1000,
  getCacheKey: () => "all",
});

const initialState = {
  drafts: [],
  pagination: { total: 0, page: 1, limit: 24, totalPages: 1 },
  loading: false,
  templates: [],
  loadingTemplates: false,
  error: null,
  successMessage: null,
};

const agreementsSlice = createSlice({
  name: "agreements",
  initialState,
  reducers: {
    clearAgreementMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgreementDrafts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgreementDrafts.fulfilled, (state, action) => {
        state.loading = false;
        state.drafts = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchAgreementDrafts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch agreements";
      })
      .addCase(createAgreementDraft.fulfilled, (state) => {
        state.successMessage = "Agreement created";
      })
      .addCase(createAgreementDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to create agreement";
      })
      .addCase(duplicateAgreementDraft.fulfilled, (state) => {
        state.successMessage = "Agreement duplicated";
      })
      .addCase(duplicateAgreementDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to duplicate agreement";
      })
      .addCase(trashAgreementDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload);
        state.successMessage = "Agreement moved to trash";
      })
      .addCase(trashAgreementDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to move agreement to trash";
      })
      .addCase(restoreAgreementDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload?.data?.id);
        state.successMessage = "Agreement restored";
      })
      .addCase(restoreAgreementDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to restore agreement";
      })
      .addCase(fetchAgreementTemplates.pending, (state) => {
        state.loadingTemplates = true;
      })
      .addCase(fetchAgreementTemplates.fulfilled, (state, action) => {
        state.loadingTemplates = false;
        state.templates = action.payload.data || [];
      })
      .addCase(fetchAgreementTemplates.rejected, (state, action) => {
        state.loadingTemplates = false;
        state.error = action.payload || "Failed to fetch templates";
      });
  },
});

export const { clearAgreementMessages } = agreementsSlice.actions;
export default agreementsSlice.reducer;
