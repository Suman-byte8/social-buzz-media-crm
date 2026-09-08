import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchDocumentsByClient as fetchDocumentsByClientApi,
  uploadDocument as uploadDocumentApi,
  deleteDocument as deleteDocumentApi,
  fetchProposals as fetchProposalsApi,
  uploadProposal as uploadProposalApi,
  fetchInvoiceDocuments as fetchInvoiceDocumentsApi,
  fetchBrandKitFiles as fetchBrandKitFilesApi,
  uploadBrandKitFile as uploadBrandKitFileApi,
  uploadBrandKitFilesBulk as uploadBrandKitFilesBulkApi,
  fetchClientFilesByType as fetchClientFilesByTypeApi,
  uploadClientFilesBulk as uploadClientFilesBulkApi,
  fetchAgreements as fetchAgreementsApi,
  uploadAgreement as uploadAgreementApi,
  updateAgreement as updateAgreementApi,
  deleteAgreement as deleteAgreementApi,
} from "@/services/documentService";

// Files/documents change rarely relative to how often each client-profile
// tab re-fetches them on mount — a generous TTL across the board here.
const DOCS_TTL_MS = 8 * 60 * 1000;

// ── Documents ────────────────────────────────────────────────────────────

export const fetchDocumentsByClient = createCachedThunk("documents/fetchByClient", fetchDocumentsByClientApi, {
  ttlMs: DOCS_TTL_MS,
});

export const uploadDocument = createAsyncThunk(
  "documents/upload",
  async ({ file, clientId, description }, { rejectWithValue }) => {
    try {
      const result = await uploadDocumentApi(file, clientId, description);
      invalidateCache("documents/fetchByClient");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload document");
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      invalidateCache("documents/fetchByClient");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete document");
    }
  }
);

// ── Proposals ────────────────────────────────────────────────────────────

export const fetchProposals = createCachedThunk("documents/fetchProposals", fetchProposalsApi, {
  ttlMs: DOCS_TTL_MS,
});

export const uploadProposal = createAsyncThunk(
  "documents/uploadProposal",
  async (formData, { rejectWithValue }) => {
    try {
      const result = await uploadProposalApi(formData);
      invalidateCache("documents/fetchProposals");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload proposal");
    }
  }
);

export const deleteProposal = createAsyncThunk(
  "documents/deleteProposal",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      invalidateCache("documents/fetchProposals");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete proposal");
    }
  }
);

// ── Invoice Documents ────────────────────────────────────────────────────

export const fetchInvoiceDocuments = createCachedThunk("documents/fetchInvoiceDocuments", fetchInvoiceDocumentsApi, {
  ttlMs: DOCS_TTL_MS,
});

export const deleteInvoiceDocument = createAsyncThunk(
  "documents/deleteInvoiceDocument",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      invalidateCache("documents/fetchInvoiceDocuments");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete invoice");
    }
  }
);

// ── Brand Kit ────────────────────────────────────────────────────────────

export const fetchBrandKit = createCachedThunk("documents/fetchBrandKit", fetchBrandKitFilesApi, {
  ttlMs: DOCS_TTL_MS,
});

export const uploadBrandKit = createAsyncThunk(
  "documents/uploadBrandKit",
  async (formData, { rejectWithValue }) => {
    try {
      const result = await uploadBrandKitFileApi(formData);
      invalidateCache("documents/fetchBrandKit");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload file");
    }
  }
);

export const uploadBrandKitBulk = createAsyncThunk(
  "documents/uploadBrandKitBulk",
  async (formData, { rejectWithValue }) => {
    try {
      const result = await uploadBrandKitFilesBulkApi(formData);
      invalidateCache("documents/fetchBrandKit");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload files");
    }
  }
);

export const deleteBrandKit = createAsyncThunk(
  "documents/deleteBrandKit",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      invalidateCache("documents/fetchBrandKit");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete file");
    }
  }
);

// ── Client Files (generic per-client tabs: Creatives, Strategy, ...) ────────
// Same media-capable upload/list/delete endpoints as Brand Kit, generalized
// with a documentType so any future per-client file tab can reuse this
// instead of adding another dedicated set of thunks/state.

export const fetchClientFiles = createCachedThunk(
  "documents/fetchClientFiles",
  async ({ clientId, documentType }) => {
    const response = await fetchClientFilesByTypeApi({ clientId, documentType });
    return { documentType, ...response };
  },
  { ttlMs: DOCS_TTL_MS, getCacheKey: ({ clientId, documentType }) => `${documentType}:${clientId}` }
);

export const uploadClientFiles = createAsyncThunk(
  "documents/uploadClientFiles",
  async ({ formData, documentType }, { rejectWithValue }) => {
    try {
      const response = await uploadClientFilesBulkApi(formData);
      invalidateCache(`documents/fetchClientFiles:${documentType}`);
      return { documentType, ...response };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload files");
    }
  }
);

export const deleteClientFile = createAsyncThunk(
  "documents/deleteClientFile",
  async ({ id, documentType }, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      invalidateCache(`documents/fetchClientFiles:${documentType}`);
      return { id, documentType };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete file");
    }
  }
);

// ── Agreements ───────────────────────────────────────────────────────────

export const fetchAgreements = createCachedThunk("documents/fetchAgreements", fetchAgreementsApi, {
  ttlMs: DOCS_TTL_MS,
});

export const uploadAgreement = createAsyncThunk(
  "documents/uploadAgreement",
  async (formData, { rejectWithValue }) => {
    try {
      const result = await uploadAgreementApi(formData);
      invalidateCache("documents/fetchAgreements");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload agreement");
    }
  }
);

export const updateAgreement = createAsyncThunk(
  "documents/updateAgreement",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const result = await updateAgreementApi(id, updateData);
      invalidateCache("documents/fetchAgreements");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update agreement");
    }
  }
);

export const deleteAgreement = createAsyncThunk(
  "documents/deleteAgreement",
  async (id, { rejectWithValue }) => {
    try {
      await deleteAgreementApi(id);
      invalidateCache("documents/fetchAgreements");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete agreement");
    }
  }
);

const initialState = {
  documents: [],
  proposals: [],
  invoiceDocuments: [],
  brandKit: [],
  // Keyed by documentType (e.g. "creative", "strategy") — see the
  // "Client Files" thunks above.
  filesByType: {},
  agreements: [],
  // Only populated when fetchAgreements is called with page/limit (the
  // admin Agreements page) — callers that fetch a single client's full
  // list (e.g. the client profile's Agreement tab) leave these at their
  // defaults.
  agreementsTotalPages: 1,
  agreementsCurrentPage: 1,
  agreementsTotalItems: 0,
  loading: false,
  loadingProposals: false,
  loadingInvoiceDocuments: false,
  loadingBrandKit: false,
  loadingFilesByType: {},
  loadingAgreements: false,
  error: null,
  successMessage: null,
};

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentsByClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByClient.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.data || [];
      })
      .addCase(fetchDocumentsByClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch documents";
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        const doc = action.payload?.data || action.payload;
        if (doc) state.documents.push(doc);
        state.successMessage = "Document uploaded successfully";
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload document";
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload);
        state.successMessage = "Document deleted successfully";
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete document";
      })
      .addCase(fetchProposals.pending, (state) => {
        state.loadingProposals = true;
        state.error = null;
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.loadingProposals = false;
        state.proposals = action.payload.data || [];
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.loadingProposals = false;
        state.error = action.payload || "Failed to fetch proposals";
      })
      .addCase(uploadProposal.fulfilled, (state, action) => {
        const doc = action.payload?.data || action.payload;
        if (doc) state.proposals.push(doc);
        state.successMessage = "Proposal uploaded successfully";
      })
      .addCase(uploadProposal.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload proposal";
      })
      .addCase(deleteProposal.fulfilled, (state, action) => {
        state.proposals = state.proposals.filter((p) => p.id !== action.payload);
        state.successMessage = "Proposal deleted successfully";
      })
      .addCase(deleteProposal.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete proposal";
      })
      .addCase(fetchInvoiceDocuments.pending, (state) => {
        state.loadingInvoiceDocuments = true;
        state.error = null;
      })
      .addCase(fetchInvoiceDocuments.fulfilled, (state, action) => {
        state.loadingInvoiceDocuments = false;
        state.invoiceDocuments = action.payload.data || [];
      })
      .addCase(fetchInvoiceDocuments.rejected, (state, action) => {
        state.loadingInvoiceDocuments = false;
        state.error = action.payload || "Failed to fetch invoices";
      })
      .addCase(deleteInvoiceDocument.fulfilled, (state, action) => {
        state.invoiceDocuments = state.invoiceDocuments.filter((d) => d.id !== action.payload);
        state.successMessage = "Invoice deleted successfully";
      })
      .addCase(deleteInvoiceDocument.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete invoice";
      })
      .addCase(fetchBrandKit.pending, (state) => {
        state.loadingBrandKit = true;
        state.error = null;
      })
      .addCase(fetchBrandKit.fulfilled, (state, action) => {
        state.loadingBrandKit = false;
        state.brandKit = action.payload.data || [];
      })
      .addCase(fetchBrandKit.rejected, (state, action) => {
        state.loadingBrandKit = false;
        state.error = action.payload || "Failed to fetch brand kit files";
      })
      .addCase(uploadBrandKit.fulfilled, (state, action) => {
        const doc = action.payload?.data || action.payload;
        // Guard against a duplicate id ever landing in the list — e.g. a
        // fast double-click firing handleUpload twice before the disabled
        // state commits, or this racing a fetchBrandKit that already
        // picked up the same freshly-created row. React keys the gallery
        // by file.id, so two entries sharing one would throw a duplicate-
        // key warning and duplicate the card on screen.
        if (doc && !state.brandKit.some((f) => f.id === doc.id)) {
          state.brandKit.push(doc);
        }
        state.successMessage = "File uploaded successfully";
      })
      .addCase(uploadBrandKit.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload file";
      })
      .addCase(uploadBrandKitBulk.fulfilled, (state, action) => {
        const docs = action.payload?.data || [];
        const existingIds = new Set(state.brandKit.map((f) => f.id));
        const newDocs = docs.filter((d) => !existingIds.has(d.id));
        state.brandKit.push(...newDocs);
        state.successMessage = action.payload?.message || "Files uploaded successfully";
      })
      .addCase(uploadBrandKitBulk.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload files";
      })
      .addCase(deleteBrandKit.fulfilled, (state, action) => {
        state.brandKit = state.brandKit.filter((f) => f.id !== action.payload);
        state.successMessage = "File deleted successfully";
      })
      .addCase(deleteBrandKit.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete file";
      })
      .addCase(fetchClientFiles.pending, (state, action) => {
        state.loadingFilesByType[action.meta.arg.documentType] = true;
        state.error = null;
      })
      .addCase(fetchClientFiles.fulfilled, (state, action) => {
        const { documentType, data } = action.payload;
        state.loadingFilesByType[documentType] = false;
        state.filesByType[documentType] = data || [];
      })
      .addCase(fetchClientFiles.rejected, (state, action) => {
        state.loadingFilesByType[action.meta.arg.documentType] = false;
        state.error = action.payload || "Failed to fetch files";
      })
      .addCase(uploadClientFiles.fulfilled, (state, action) => {
        const { documentType, data = [], message } = action.payload;
        if (!state.filesByType[documentType]) state.filesByType[documentType] = [];
        // Same duplicate-id guard as Brand Kit's bulk upload — see the
        // comment above uploadBrandKitBulk.fulfilled.
        const existingIds = new Set(state.filesByType[documentType].map((f) => f.id));
        const newDocs = data.filter((d) => !existingIds.has(d.id));
        state.filesByType[documentType].push(...newDocs);
        state.successMessage = message || "Files uploaded successfully";
      })
      .addCase(uploadClientFiles.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload files";
      })
      .addCase(deleteClientFile.fulfilled, (state, action) => {
        const { id, documentType } = action.payload;
        if (state.filesByType[documentType]) {
          state.filesByType[documentType] = state.filesByType[documentType].filter((f) => f.id !== id);
        }
        state.successMessage = "File deleted successfully";
      })
      .addCase(deleteClientFile.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete file";
      })
      .addCase(fetchAgreements.pending, (state) => {
        state.loadingAgreements = true;
        state.error = null;
      })
      .addCase(fetchAgreements.fulfilled, (state, action) => {
        state.loadingAgreements = false;
        state.agreements = action.payload.data || [];
        state.agreementsTotalPages = action.payload.pagination?.totalPages || 1;
        state.agreementsCurrentPage = action.payload.pagination?.page || 1;
        state.agreementsTotalItems = action.payload.pagination?.total || action.payload.data?.length || 0;
      })
      .addCase(fetchAgreements.rejected, (state, action) => {
        state.loadingAgreements = false;
        state.error = action.payload || "Failed to fetch agreements";
      })
      .addCase(uploadAgreement.fulfilled, (state, action) => {
        if (action.payload) state.agreements.push(action.payload);
        state.successMessage = "Agreement uploaded successfully";
      })
      .addCase(uploadAgreement.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload agreement";
      })
      .addCase(updateAgreement.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.agreements.findIndex((a) => a.id === updated.id);
          if (idx !== -1) state.agreements[idx] = updated;
        }
        state.successMessage = "Agreement updated successfully";
      })
      .addCase(updateAgreement.rejected, (state, action) => {
        state.error = action.payload || "Failed to update agreement";
      })
      .addCase(deleteAgreement.fulfilled, (state, action) => {
        state.agreements = state.agreements.filter((a) => a.id !== action.payload);
        state.successMessage = "Agreement deleted successfully";
      })
      .addCase(deleteAgreement.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete agreement";
      });
  },
});

export const { clearMessages } = documentsSlice.actions;
export default documentsSlice.reducer;
