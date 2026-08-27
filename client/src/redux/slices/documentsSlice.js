import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchDocumentsByClient as fetchDocumentsByClientApi,
  uploadDocument as uploadDocumentApi,
  deleteDocument as deleteDocumentApi,
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
  agreements: [],
  loading: false,
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
