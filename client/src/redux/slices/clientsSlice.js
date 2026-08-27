import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchClients as fetchClientsApi,
  fetchClientById as fetchClientByIdApi,
  createClient as createClientApi,
  updateClient as updateClientApi,
  deleteClient as deleteClientApi,
  exportClients as exportClientsApi,
  uploadClientLogo as uploadClientLogoApi,
} from "@/services/clientService";

export const fetchClients = createAsyncThunk(
  "clients/fetchClients",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await fetchClientsApi(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch clients");
    }
  }
);

export const fetchClientById = createAsyncThunk(
  "clients/fetchClientById",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchClientByIdApi(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch client");
    }
  }
);

export const createClient = createAsyncThunk(
  "clients/createClient",
  async (clientData, { rejectWithValue }) => {
    try {
      return await createClientApi(clientData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create client");
    }
  }
);

export const updateClient = createAsyncThunk(
  "clients/updateClient",
  async ({ id, clientData }, { rejectWithValue }) => {
    try {
      return await updateClientApi(id, clientData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update client");
    }
  }
);

export const uploadClientLogo = createAsyncThunk(
  "clients/uploadLogo",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      return await uploadClientLogoApi(id, file);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload logo");
    }
  }
);

export const deleteClient = createAsyncThunk(
  "clients/deleteClient",
  async (id, { rejectWithValue }) => {
    try {
      await deleteClientApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete client");
    }
  }
);

export const exportClients = createAsyncThunk(
  "clients/exportClients",
  async (params = {}, { rejectWithValue }) => {
    try {
      const blob = await exportClientsApi(params);
      return { blob, filename: "clients-export.csv" };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to export clients");
    }
  }
);

const initialState = {
  clients: [],
  client: null,
  loading: false,
  loadingClient: false,
  error: null,
  successMessage: null,
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
};

const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // fetchClients
    builder.addCase(fetchClients.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchClients.fulfilled, (state, action) => {
      state.loading = false;
      state.clients = action.payload.data;
      state.totalPages = action.payload.pagination?.totalPages || 1;
      state.currentPage = action.payload.pagination?.page || 1;
      state.totalItems = action.payload.pagination?.total || 0;
    });
    builder.addCase(fetchClients.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch clients";
    });
    // fetchClientById
    builder.addCase(fetchClientById.pending, (state) => {
      state.loadingClient = true;
      state.error = null;
    });
    builder.addCase(fetchClientById.fulfilled, (state, action) => {
      state.loadingClient = false;
      state.client = action.payload.data;
    });
    builder.addCase(fetchClientById.rejected, (state, action) => {
      state.loadingClient = false;
      state.error = action.payload || "Failed to fetch client";
    });
    // createClient
    builder.addCase(createClient.pending, (state) => {
      state.error = null;
    });
    builder.addCase(createClient.fulfilled, (state) => {
      state.successMessage = "Client created successfully";
      state.error = null;
      state.currentPage = 1;
    });
    builder.addCase(createClient.rejected, (state, action) => {
      state.error = action.payload || "Failed to create client";
    });
    // updateClient
    builder.addCase(updateClient.pending, (state) => {
      state.error = null;
    });
    builder.addCase(updateClient.fulfilled, (state) => {
      state.successMessage = "Client updated successfully";
      state.error = null;
    });
    builder.addCase(updateClient.rejected, (state, action) => {
      state.error = action.payload || "Failed to update client";
    });
    // uploadClientLogo
    builder.addCase(uploadClientLogo.fulfilled, (state, action) => {
      const updated = action.payload?.data;
      if (updated?.id) {
        if (state.client?.id === updated.id) state.client = updated;
        const idx = state.clients.findIndex((c) => c.id === updated.id);
        if (idx !== -1) state.clients[idx] = updated;
      }
      state.successMessage = "Logo uploaded successfully";
    });
    builder.addCase(uploadClientLogo.rejected, (state, action) => {
      state.error = action.payload || "Failed to upload logo";
    });
    // deleteClient
    builder.addCase(deleteClient.pending, (state) => {
      state.error = null;
    });
    builder.addCase(deleteClient.fulfilled, (state) => {
      state.successMessage = "Client deleted successfully";
      state.error = null;
    });
    builder.addCase(deleteClient.rejected, (state, action) => {
      state.error = action.payload || "Failed to delete client";
    });
    // exportClients
    builder.addCase(exportClients.pending, (state) => {
      state.error = null;
    });
    builder.addCase(exportClients.fulfilled, (state, action) => {
      const url = URL.createObjectURL(action.payload.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = action.payload.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      state.successMessage = "Clients exported successfully";
    });
    builder.addCase(exportClients.rejected, (state, action) => {
      state.error = action.payload || "Failed to export clients";
    });
  },
});

export const { clearMessages } = clientsSlice.actions;
export default clientsSlice.reducer;
