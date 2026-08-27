import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchMeetingNotes as fetchMeetingNotesApi,
  createMeetingNote as createMeetingNoteApi,
  updateMeetingNote as updateMeetingNoteApi,
  deleteMeetingNote as deleteMeetingNoteApi,
} from "@/services/meetingNoteService";

export const fetchMeetingNotes = createAsyncThunk(
  "meetingNotes/fetchAll",
  async (clientId, { rejectWithValue }) => {
    try {
      return await fetchMeetingNotesApi(clientId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch meeting notes");
    }
  }
);

export const createMeetingNote = createAsyncThunk(
  "meetingNotes/create",
  async (meetingData, { rejectWithValue }) => {
    try {
      return await createMeetingNoteApi(meetingData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create meeting note");
    }
  }
);

export const updateMeetingNote = createAsyncThunk(
  "meetingNotes/update",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      return await updateMeetingNoteApi(id, updateData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update meeting note");
    }
  }
);

export const deleteMeetingNote = createAsyncThunk(
  "meetingNotes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteMeetingNoteApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete meeting note");
    }
  }
);

const initialState = {
  meetingNotes: [],
  loading: false,
  error: null,
  successMessage: null,
};

const meetingNotesSlice = createSlice({
  name: "meetingNotes",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetingNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.meetingNotes = action.payload.data || [];
      })
      .addCase(fetchMeetingNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch meeting notes";
      })
      .addCase(createMeetingNote.fulfilled, (state, action) => {
        const note = action.payload?.data || action.payload;
        if (note) state.meetingNotes.push(note);
        state.successMessage = "Meeting note added successfully";
      })
      .addCase(createMeetingNote.rejected, (state, action) => {
        state.error = action.payload || "Failed to create meeting note";
      })
      .addCase(updateMeetingNote.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.meetingNotes.findIndex((n) => n.id === updated.id);
          if (idx !== -1) state.meetingNotes[idx] = updated;
        }
        state.successMessage = "Meeting note updated successfully";
      })
      .addCase(updateMeetingNote.rejected, (state, action) => {
        state.error = action.payload || "Failed to update meeting note";
      })
      .addCase(deleteMeetingNote.fulfilled, (state, action) => {
        state.meetingNotes = state.meetingNotes.filter((n) => n.id !== action.payload);
        state.successMessage = "Meeting note deleted successfully";
      })
      .addCase(deleteMeetingNote.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete meeting note";
      });
  },
});

export const { clearMessages } = meetingNotesSlice.actions;
export default meetingNotesSlice.reducer;
