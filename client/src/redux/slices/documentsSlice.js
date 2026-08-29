import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchDocumentsByClient as fetchDocumentsByClientApi,
  uploadDocument as uploadDocumentApi,
  deleteDocument as deleteDocumentApi,
  fetchProposals as fetchProposalsApi,
  uploadProposal as uploadProposalApi,
  fetchInvoiceDocuments as fetchInvoiceDocumentsApi,
  fetchBrandKitFiles as fetchBrandKitFilesApi,
  uploadBrandKitFile as uploadBrandKitFileApi,
  fetchAgreements as fetchAgreementsApi,
  uploadAgreement as uploadAgreementApi,
  updateAgreement as updateAgreementApi,
  deleteAgreement as deleteAgreementApi,
} from "@/services/documentService";

// ── Documents ────────────────────────────────────────────────────────────

export const fetchDocumentsByClient = createAsyncThunk(
  "documents/fetchByClient",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchDocumentsByClientApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch documents");
    }
  }
);

export const uploadDocument = createAsyncThunk(
  "documents/upload",
  async ({ file, clientId, description }, { rejectWithValue }) => {
    try {
      return await uploadDocumentApi(file, clientId, description);
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
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete document");
    }
  }
);

// ── Proposals ────────────────────────────────────────────────────────────

export const fetchProposals = createAsyncThunk(
  "documents/fetchProposals",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchProposalsApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch proposals");
    }
  }
);

export const uploadProposal = createAsyncThunk(
  "documents/uploadProposal",
  async (formData, { rejectWithValue }) => {
    try {
      return await uploadProposalApi(formData);
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
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete proposal");
    }
  }
);

// ── Invoice Documents ────────────────────────────────────────────────────

export const fetchInvoiceDocuments = createAsyncThunk(
  "documents/fetchInvoiceDocuments",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchInvoiceDocumentsApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch invoices");
    }
  }
);

export const deleteInvoiceDocument = createAsyncThunk(
  "documents/deleteInvoiceDocument",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete invoice");
    }
  }
);

// ── Brand Kit ────────────────────────────────────────────────────────────

export const fetchBrandKit = createAsyncThunk(
  "documents/fetchBrandKit",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchBrandKitFilesApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch brand kit files");
    }
  }
);

export const uploadBrandKit = createAsyncThunk(
  "documents/uploadBrandKit",
  async (formData, { rejectWithValue }) => {
    try {
      return await uploadBrandKitFileApi(formData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload file");
    }
  }
);

export const deleteBrandKit = createAsyncThunk(
  "documents/deleteBrandKit",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete file");
    }
  }
);

// ── Agreements ───────────────────────────────────────────────────────────

export const fetchAgreements = createAsyncThunk(
  "documents/fetchAgreements",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchAgreementsApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch agreements");
    }
  }
);

export const uploadAgreement = createAsyncThunk(
  "documents/uploadAgreement",
  async (formData, { rejectWithValue }) => {
    try {
      return await uploadAgreementApi(formData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload agreement");
    }
  }
);

export const updateAgreement = createAsyncThunk(
  "documents/updateAgreement",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      return await updateAgreementApi(id, updateData);
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
  agreements: [],
  loading: false,
  loadingProposals: false,
  loadingInvoiceDocuments: false,
  loadingBrandKit: false,
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
        if (doc) state.brandKit.push(doc);
        state.successMessage = "File uploaded successfully";
      })
      .addCase(uploadBrandKit.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload file";
      })
      .addCase(deleteBrandKit.fulfilled, (state, action) => {
        state.brandKit = state.brandKit.filter((f) => f.id !== action.payload);
        state.successMessage = "File deleted successfully";
      })
      .addCase(deleteBrandKit.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete file";
      })
      .addCase(fetchAgreements.pending, (state) => {
        state.loadingAgreements = true;
        state.error = null;
      })
      .addCase(fetchAgreements.fulfilled, (state, action) => {
        state.loadingAgreements = false;
        state.agreements = action.payload.data || [];
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
