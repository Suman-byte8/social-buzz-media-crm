import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/services/apiClient";

export const fetchClients = createAsyncThunk(
  "clients/fetchClients",
  async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient(`/clients?${queryString}`);
    return response;
  }
);

export const fetchClientById = createAsyncThunk(
  "clients/fetchClientById",
  async (id) => {
    const response = await apiClient(`/clients/${id}`);
    return response;
  }
);

export const createClient = createAsyncThunk(
  "clients/createClient",
  async (clientData) => {
    const response = await apiClient("/clients", {
      method: "POST",
      body: clientData,
    });
    return response;
  }
);

export const updateClient = createAsyncThunk(
  "clients/updateClient",
  async ({ id, clientData }) => {
    const response = await apiClient(`/clients/${id}`, {
      method: "PUT",
      body: clientData,
    });
    return response;
  }
);

export const deleteClient = createAsyncThunk(
  "clients/deleteClient",
  async (id) => {
    const response = await apiClient(`/clients/${id}`, {
      method: "DELETE",
    });
    return response;
  }
);

export const exportClients = createAsyncThunk(
  "clients/exportClients",
  async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const response = await fetch(`${API_BASE_URL}/clients/export?${queryString}`, {
      method: "GET",
      headers: {
        Accept: "text/csv",
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to export clients: ${error}`);
    }
    const blob = await response.blob();
    return { blob, filename: "clients-export.csv" };
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
      state.error = action.payload?.message || "Failed to fetch clients";
    });
    // fetchClientById
    builder.addCase(fetchClientById.pending, (state) => {
      state.loadingClient = true;
    });
    builder.addCase(fetchClientById.fulfilled, (state, action) => {
      state.loadingClient = false;
      state.client = action.payload.data;
    });
    builder.addCase(fetchClientById.rejected, (state, action) => {
      state.loadingClient = false;
      state.error = action.payload?.message || "Failed to fetch client";
    });
    // createClient
    builder.addCase(createClient.pending, (state) => {
      state.error = null;
    });
    builder.addCase(createClient.fulfilled, (state, action) => {
      state.successMessage = "Client created successfully";
      state.error = null;
      state.currentPage = 1;
    });
    builder.addCase(createClient.rejected, (state, action) => {
      state.error = action.payload?.message || "Failed to create client";
    });
    // updateClient
    builder.addCase(updateClient.pending, (state) => {
      state.error = null;
    });
    builder.addCase(updateClient.fulfilled, (state, action) => {
      state.successMessage = "Client updated successfully";
      state.error = null;
    });
    builder.addCase(updateClient.rejected, (state, action) => {
      state.error = action.payload?.message || "Failed to update client";
    });
    // deleteClient
    builder.addCase(deleteClient.pending, (state) => {
      state.error = null;
    });
    builder.addCase(deleteClient.fulfilled, (state, action) => {
      state.successMessage = "Client deleted successfully";
      state.error = null;
    });
    builder.addCase(deleteClient.rejected, (state, action) => {
      state.error = action.payload?.message || "Failed to delete client";
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
      state.error = action.payload?.message || "Failed to export clients";
    });
  },
});

export const { clearMessages } = clientsSlice.actions;
export default clientsSlice.reducer;