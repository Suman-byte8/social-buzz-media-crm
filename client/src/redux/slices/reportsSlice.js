import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createCachedThunk } from "@/redux/cachedThunk";
import { invalidateCache } from "@/utils/cache";
import {
  fetchReports as fetchReportsApi,
  createReport as createReportApi,
  autoGenerateReport as autoGenerateReportApi,
  updateReport as updateReportApi,
  duplicateReport as duplicateReportApi,
  trashReport as trashReportApi,
  restoreReport as restoreReportApi,
  permanentlyDeleteReport as permanentlyDeleteReportApi,
  fetchReportTemplates as fetchReportTemplatesApi,
  saveReportTemplate as saveReportTemplateApi,
  deleteReportTemplate as deleteReportTemplateApi,
} from "@/services/reportService";

// This slice only covers the Reports Dashboard's list/CRUD surface. The
// editor's own live document (the thing someone is actively dragging/
// typing into) deliberately stays out of Redux — see useReportEditor.js —
// same split InvoiceBuilder/SalarySlipBuilder already use: Redux for a
// picker's data, plain React state for a fast-changing canvas document
// that would otherwise re-render the whole store on every keystroke/drag.

const REPORTS_TTL_MS = 2 * 60 * 1000;

export const fetchReports = createCachedThunk("reports/fetchReports", fetchReportsApi, {
  ttlMs: REPORTS_TTL_MS,
  getCacheKey: (params) => JSON.stringify(params || {}),
});

export const createReport = createAsyncThunk("reports/createReport", async (payload, { rejectWithValue }) => {
  try {
    const result = await createReportApi(payload);
    invalidateCache("reports/fetchReports");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to create report");
  }
});

export const autoGenerateReport = createAsyncThunk(
  "reports/autoGenerateReport",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await autoGenerateReportApi(payload);
      invalidateCache("reports/fetchReports");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to generate report from screenshots");
    }
  }
);

// Dashboard-only "Rename" quick action — title-only update, reusing the
// same PUT /reports/:id the editor's full save hits (omitting documentData
// leaves the document itself untouched, see reportRoutes.js).
export const renameReportTitle = createAsyncThunk(
  "reports/renameReportTitle",
  async ({ id, title }, { rejectWithValue }) => {
    try {
      const result = await updateReportApi(id, { title });
      invalidateCache("reports/fetchReports");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to rename report");
    }
  }
);

export const duplicateReport = createAsyncThunk("reports/duplicateReport", async (id, { rejectWithValue }) => {
  try {
    const result = await duplicateReportApi(id);
    invalidateCache("reports/fetchReports");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to duplicate report");
  }
});

export const trashReport = createAsyncThunk("reports/trashReport", async (id, { rejectWithValue }) => {
  try {
    await trashReportApi(id);
    invalidateCache("reports/fetchReports");
    return id;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to move report to trash");
  }
});

export const restoreReport = createAsyncThunk("reports/restoreReport", async (id, { rejectWithValue }) => {
  try {
    const result = await restoreReportApi(id);
    invalidateCache("reports/fetchReports");
    return result;
  } catch (error) {
    return rejectWithValue(error.message || "Failed to restore report");
  }
});

export const permanentlyDeleteReport = createAsyncThunk(
  "reports/permanentlyDeleteReport",
  async (id, { rejectWithValue }) => {
    try {
      await permanentlyDeleteReportApi(id);
      invalidateCache("reports/fetchReports");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to permanently delete report");
    }
  }
);

export const fetchReportTemplates = createCachedThunk("reports/fetchReportTemplates", fetchReportTemplatesApi, {
  ttlMs: 5 * 60 * 1000,
  getCacheKey: (params) => JSON.stringify(params || {}),
});

export const saveReportTemplate = createAsyncThunk(
  "reports/saveReportTemplate",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await saveReportTemplateApi(payload);
      invalidateCache("reports/fetchReportTemplates");
      return result;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save template");
    }
  }
);

export const deleteReportTemplate = createAsyncThunk(
  "reports/deleteReportTemplate",
  async (id, { rejectWithValue }) => {
    try {
      await deleteReportTemplateApi(id);
      invalidateCache("reports/fetchReportTemplates");
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete template");
    }
  }
);

const initialState = {
  reports: [],
  pagination: { total: 0, page: 1, limit: 24, totalPages: 1 },
  loading: false,
  templates: [],
  loadingTemplates: false,
  error: null,
  successMessage: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReportMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch reports";
      })
      .addCase(createReport.fulfilled, (state) => {
        state.successMessage = "Report created";
      })
      .addCase(createReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to create report";
      })
      .addCase(autoGenerateReport.fulfilled, (state, action) => {
        state.successMessage = action.payload?.data?.aiGenerated
          ? "Report generated from your screenshots"
          : "Screenshots uploaded, but AI analysis failed — added as a plain gallery";
      })
      .addCase(autoGenerateReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to generate report from screenshots";
      })
      .addCase(renameReportTitle.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated) {
          const idx = state.reports.findIndex((r) => r.id === updated.id);
          if (idx !== -1) state.reports[idx] = { ...state.reports[idx], title: updated.title };
        }
        state.successMessage = "Report renamed";
      })
      .addCase(renameReportTitle.rejected, (state, action) => {
        state.error = action.payload || "Failed to rename report";
      })
      .addCase(duplicateReport.fulfilled, (state) => {
        state.successMessage = "Report duplicated";
      })
      .addCase(duplicateReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to duplicate report";
      })
      .addCase(trashReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter((r) => r.id !== action.payload);
        state.successMessage = "Report moved to trash";
      })
      .addCase(trashReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to move report to trash";
      })
      .addCase(restoreReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter((r) => r.id !== action.payload?.data?.id);
        state.successMessage = "Report restored";
      })
      .addCase(restoreReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to restore report";
      })
      .addCase(permanentlyDeleteReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter((r) => r.id !== action.payload);
        state.successMessage = "Report permanently deleted";
      })
      .addCase(permanentlyDeleteReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to permanently delete report";
      })
      .addCase(fetchReportTemplates.pending, (state) => {
        state.loadingTemplates = true;
      })
      .addCase(fetchReportTemplates.fulfilled, (state, action) => {
        state.loadingTemplates = false;
        state.templates = action.payload.data || [];
      })
      .addCase(fetchReportTemplates.rejected, (state, action) => {
        state.loadingTemplates = false;
        state.error = action.payload || "Failed to fetch templates";
      })
      .addCase(saveReportTemplate.fulfilled, (state) => {
        state.successMessage = "Template saved";
      })
      .addCase(saveReportTemplate.rejected, (state, action) => {
        state.error = action.payload || "Failed to save template";
      })
      .addCase(deleteReportTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t.id !== action.payload);
        state.successMessage = "Template deleted";
      })
      .addCase(deleteReportTemplate.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete template";
      });
  },
});

export const { clearReportMessages } = reportsSlice.actions;
export default reportsSlice.reducer;
