import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchTeamMembers as fetchTeamMembersApi,
  fetchTeamMemberById as fetchTeamMemberByIdApi,
  createTeamMember as createTeamMemberApi,
  updateTeamMember as updateTeamMemberApi,
  deleteTeamMember as deleteTeamMemberApi,
  uploadTeamMemberAvatar as uploadTeamMemberAvatarApi,
  uploadTeamMemberResume as uploadTeamMemberResumeApi,
} from "@/services/teamService";

export const fetchTeamMembers = createAsyncThunk(
  "team/fetchTeamMembers",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchTeamMembersApi();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch team members");
    }
  }
);

export const fetchTeamMemberById = createAsyncThunk(
  "team/fetchTeamMemberById",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchTeamMemberByIdApi(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch team member");
    }
  }
);

export const createTeamMember = createAsyncThunk(
  "team/createTeamMember",
  async (memberData, { rejectWithValue }) => {
    try {
      return await createTeamMemberApi(memberData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create team member");
    }
  }
);

export const updateTeamMember = createAsyncThunk(
  "team/updateTeamMember",
  async ({ id, memberData }, { rejectWithValue }) => {
    try {
      return await updateTeamMemberApi(id, memberData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update team member");
    }
  }
);

export const deleteTeamMember = createAsyncThunk(
  "team/deleteTeamMember",
  async (id, { rejectWithValue }) => {
    try {
      await deleteTeamMemberApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete team member");
    }
  }
);

export const uploadTeamMemberAvatar = createAsyncThunk(
  "team/uploadAvatar",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      return await uploadTeamMemberAvatarApi(id, file);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload profile image");
    }
  }
);

export const uploadTeamMemberResume = createAsyncThunk(
  "team/uploadResume",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      return await uploadTeamMemberResumeApi(id, file);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to upload resume");
    }
  }
);

const initialState = {
  teamMembers: [],
  member: null,
  loading: false,
  loadingMember: false,
  error: null,
  successMessage: null,
};

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.teamMembers = action.payload || [];
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch team members";
      })
      .addCase(fetchTeamMemberById.pending, (state) => {
        state.loadingMember = true;
      })
      .addCase(fetchTeamMemberById.fulfilled, (state, action) => {
        state.loadingMember = false;
        state.member = action.payload?.data || action.payload || null;
      })
      .addCase(fetchTeamMemberById.rejected, (state, action) => {
        state.loadingMember = false;
        state.error = action.payload || "Failed to fetch team member";
      })
      .addCase(createTeamMember.fulfilled, (state) => {
        state.successMessage = "Team member added successfully";
      })
      .addCase(createTeamMember.rejected, (state, action) => {
        state.error = action.payload || "Failed to create team member";
      })
      .addCase(updateTeamMember.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.teamMembers.findIndex((m) => m.id === updated.id);
          if (idx !== -1) state.teamMembers[idx] = updated;
          if (state.member?.id === updated.id) state.member = updated;
        }
        state.successMessage = "Team member updated successfully";
      })
      .addCase(updateTeamMember.rejected, (state, action) => {
        state.error = action.payload || "Failed to update team member";
      })
      .addCase(uploadTeamMemberAvatar.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated?.id) {
          const idx = state.teamMembers.findIndex((m) => m.id === updated.id);
          if (idx !== -1) state.teamMembers[idx] = updated;
          if (state.member?.id === updated.id) state.member = updated;
        }
        state.successMessage = "Profile image uploaded successfully";
      })
      .addCase(uploadTeamMemberAvatar.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload profile image";
      })
      .addCase(uploadTeamMemberResume.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated?.id) {
          const idx = state.teamMembers.findIndex((m) => m.id === updated.id);
          if (idx !== -1) state.teamMembers[idx] = updated;
          if (state.member?.id === updated.id) state.member = updated;
        }
        state.successMessage = "Resume uploaded successfully";
      })
      .addCase(uploadTeamMemberResume.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload resume";
      })
      .addCase(deleteTeamMember.fulfilled, (state, action) => {
        state.teamMembers = state.teamMembers.filter((m) => m.id !== action.payload);
        state.successMessage = "Team member deleted successfully";
      })
      .addCase(deleteTeamMember.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete team member";
      });
  },
});

export const { clearMessages } = teamSlice.actions;
export default teamSlice.reducer;
