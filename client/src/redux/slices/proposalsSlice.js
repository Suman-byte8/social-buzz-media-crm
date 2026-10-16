import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchProposalDrafts as fetchProposalDraftsApi,
  createProposalDraft as createProposalDraftApi,
  duplicateProposalDraft as duplicateProposalDraftApi,
  trashProposalDraft as trashProposalDraftApi,
  restoreProposalDraft as restoreProposalDraftApi,
  fetchProposalTemplates as fetchProposalTemplatesApi,
} from "@/services/proposalService";

// Mirrors agreementsSlice.js's split: this slice only covers the Proposal
// Generator's own list/CRUD surface. The editor's own live document stays
// out of Redux entirely — see useProposalEditor.js. Stays separate from
// documentsSlice's existing fetchProposals/uploadProposal/deleteProposal
// (the upload-based file list), same coexistence agreementsSlice already
// has with documentsSlice's fetchAgreements.

const PROPOSAL_DRAFTS_TTL_MS = 2 * 60 * 1000;

export const fetchProposalDrafts = createCachedThunk("proposals/fetchProposalDrafts", fetchProposalDraftsApi, {
  ttlMs: PROPOSAL_DRAFTS_TTL_MS,
  getCacheKey: (params) => JSON.stringify(params || {}),
});

export const createProposalDraft = createAsyncThunk("proposals/createProposalDraft", async (payload, { rejectWithValue }) => {
  try {
    const result = await createProposalDraftApi(payload);
    invalidateCache("proposals/fetchProposalDrafts");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to create proposal");
  }
});

export const duplicateProposalDraft = createAsyncThunk("proposals/duplicateProposalDraft", async (id, { rejectWithValue }) => {
  try {
    const result = await duplicateProposalDraftApi(id);
    invalidateCache("proposals/fetchProposalDrafts");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to duplicate proposal");
  }
});

export const trashProposalDraft = createAsyncThunk("proposals/trashProposalDraft", async (id, { rejectWithValue }) => {
  try {
    await trashProposalDraftApi(id);
    invalidateCache("proposals/fetchProposalDrafts");
    return id;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to move proposal to trash");
  }
});

export const restoreProposalDraft = createAsyncThunk("proposals/restoreProposalDraft", async (id, { rejectWithValue }) => {
  try {
    const result = await restoreProposalDraftApi(id);
    invalidateCache("proposals/fetchProposalDrafts");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to restore proposal");
  }
});

export const fetchProposalTemplates = createCachedThunk("proposals/fetchProposalTemplates", fetchProposalTemplatesApi, {
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

const proposalsSlice = createSlice({
  name: "proposals",
  initialState,
  reducers: {
    clearProposalMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposalDrafts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProposalDrafts.fulfilled, (state, action) => {
        state.loading = false;
        state.drafts = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchProposalDrafts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch proposals";
      })
      .addCase(createProposalDraft.fulfilled, (state) => {
        state.successMessage = "Proposal created";
      })
      .addCase(createProposalDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to create proposal";
      })
      .addCase(duplicateProposalDraft.fulfilled, (state) => {
        state.successMessage = "Proposal duplicated";
      })
      .addCase(duplicateProposalDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to duplicate proposal";
      })
      .addCase(trashProposalDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload);
        state.successMessage = "Proposal moved to trash";
      })
      .addCase(trashProposalDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to move proposal to trash";
      })
      .addCase(restoreProposalDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload?.data?.id);
        state.successMessage = "Proposal restored";
      })
      .addCase(restoreProposalDraft.rejected, (state, action) => {
        state.error = action.payload || "Failed to restore proposal";
      })
      .addCase(fetchProposalTemplates.pending, (state) => {
        state.loadingTemplates = true;
      })
      .addCase(fetchProposalTemplates.fulfilled, (state, action) => {
        state.loadingTemplates = false;
        state.templates = action.payload.data || [];
      })
      .addCase(fetchProposalTemplates.rejected, (state, action) => {
        state.loadingTemplates = false;
        state.error = action.payload || "Failed to fetch templates";
      });
  },
});

export const { clearProposalMessages } = proposalsSlice.actions;
export default proposalsSlice.reducer;
