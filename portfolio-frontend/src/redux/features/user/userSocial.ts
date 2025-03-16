// portfolio-frontend/src/redux/features/user/userSocial.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../../config/hostname";
import { RootState } from "../../store";
import { User, UserState, normalizeBirthdate } from "./UserTypes";


const initialState: UserSocialState = {
  user: null,
  members: [],
  status: "idle",
  error: null,
  message: null,
};

// Actions
export const likeUser = createAsyncThunk(
  "userSocial/likeUser",
  async ({ likerId, likedId }: { likerId: string; likedId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Liking user ${likedId} by ${likerId}`);
      await axios.post(`${BASE_URL}/api/users/${likerId}/like/${likedId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ User ${likedId} liked by ${likerId}`);
      return { likerId, likedId };
    } catch (error: any) {
      console.error("❌ Échec de likeUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to like user");
    }
  }
);

export const unlikeUser = createAsyncThunk(
  "userSocial/unlikeUser",
  async ({ likerId, likedId }: { likerId: string; likedId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Unliking user ${likedId} by ${likerId}`);
      await axios.delete(`${BASE_URL}/api/users/${likerId}/unlike/${likedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ User ${likedId} unliked by ${likerId}`);
      return { likerId, likedId };
    } catch (error: any) {
      console.error("❌ Échec de unlikeUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to unlike user");
    }
  }
);

export const blockUser = createAsyncThunk(
  "userSocial/blockUser",
  async ({ blockerId, blockedId }: { blockerId: string; blockedId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Blocking user ${blockedId} by ${blockerId}`);
      const response = await axios.post(`${BASE_URL}/api/users/${blockerId}/block/${blockedId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ User ${blockedId} blocked by ${blockerId}:`, response.data.message);
      return { blockerId, blockedId };
    } catch (error: any) {
      console.error("❌ Échec de blockUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to block user");
    }
  }
);

export const unblockUser = createAsyncThunk(
  "userSocial/unblockUser",
  async ({ blockerId, blockedId }: { blockerId: string; blockedId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Unblocking user ${blockedId} by ${blockerId}`);
      const response = await axios.delete(`${BASE_URL}/api/users/${blockerId}/unblock/${blockedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ User ${blockedId} unblocked by ${blockerId}:`, response.data.message);
      return { blockerId, blockedId };
    } catch (error: any) {
      console.error("❌ Échec de unblockUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to unblock user");
    }
  }
);

// Reducer
const userSocialSlice = createSlice({
  name: "userSocial",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(likeUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(likeUser.fulfilled, (state, action: PayloadAction<{ likerId: string; likedId: string }>) => {
        state.status = "succeeded";
        const { likerId, likedId } = action.payload;

        if (state.user && state.user.id === likerId) {
          state.user.likedUserIds = state.user.likedUserIds || [];
          if (!state.user.likedUserIds.includes(likedId)) {
            state.user.likedUserIds.push(likedId);
          }
        }

        const likerIndex = state.members.findIndex((m) => m.id === likerId);
        if (likerIndex !== -1) {
          state.members[likerIndex].likedUserIds = state.members[likerIndex].likedUserIds || [];
          if (!state.members[likerIndex].likedUserIds!.includes(likedId)) {
            state.members[likerIndex].likedUserIds!.push(likedId);
          }
        }

        const likedIndex = state.members.findIndex((m) => m.id === likedId);
        if (likedIndex !== -1) {
          state.members[likedIndex].likerUserIds = state.members[likedIndex].likerUserIds || [];
          if (!state.members[likedIndex].likerUserIds!.includes(likerId)) {
            state.members[likedIndex].likerUserIds!.push(likerId);
          }
        }

        state.message = "Utilisateur liké avec succès !";
        state.error = null;
      })
      .addCase(likeUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(unlikeUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(unlikeUser.fulfilled, (state, action: PayloadAction<{ likerId: string; likedId: string }>) => {
        state.status = "succeeded";
        const { likerId, likedId } = action.payload;

        if (state.user && state.user.id === likerId) {
          state.user.likedUserIds = state.user.likedUserIds?.filter((id) => id !== likedId) || [];
        }

        const likerIndex = state.members.findIndex((m) => m.id === likerId);
        if (likerIndex !== -1) {
          state.members[likerIndex].likedUserIds =
            state.members[likerIndex].likedUserIds?.filter((id) => id !== likedId) || [];
        }

        const likedIndex = state.members.findIndex((m) => m.id === likedId);
        if (likedIndex !== -1) {
          state.members[likedIndex].likerUserIds =
            state.members[likedIndex].likerUserIds?.filter((id) => id !== likerId) || [];
        }

        state.message = "Like retiré avec succès !";
        state.error = null;
      })
      .addCase(unlikeUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(blockUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(blockUser.fulfilled, (state, action: PayloadAction<{ blockerId: string; blockedId: string }>) => {
        state.status = "succeeded";
        const { blockerId, blockedId } = action.payload;

        if (state.user && state.user.id === blockerId) {
          state.user.blockedUserIds = state.user.blockedUserIds || [];
          if (!state.user.blockedUserIds.includes(blockedId)) {
            state.user.blockedUserIds.push(blockedId);
          }
          // Supprimer les relations d'amitié si elles existent
          state.user.friendIds = state.user.friendIds?.filter((id) => id !== blockedId) || [];
          state.user.friendRequestSentIds = state.user.friendRequestSentIds?.filter((id) => id !== blockedId) || [];
          state.user.friendRequestReceivedIds = state.user.friendRequestReceivedIds?.filter((id) => id !== blockedId) || [];
          state.user.likedUserIds = state.user.likedUserIds?.filter((id) => id !== blockedId) || [];
          state.user.likerUserIds = state.user.likerUserIds?.filter((id) => id !== blockedId) || [];
        }

        const blockerIndex = state.members.findIndex((m) => m.id === blockerId);
        if (blockerIndex !== -1) {
          state.members[blockerIndex].blockedUserIds = state.members[blockerIndex].blockedUserIds || [];
          if (!state.members[blockerIndex].blockedUserIds!.includes(blockedId)) {
            state.members[blockerIndex].blockedUserIds!.push(blockedId);
          }
          // Supprimer les relations d'amitié
          state.members[blockerIndex].friendIds = state.members[blockerIndex].friendIds?.filter((id) => id !== blockedId) || [];
          state.members[blockerIndex].friendRequestSentIds = state.members[blockerIndex].friendRequestSentIds?.filter((id) => id !== blockedId) || [];
          state.members[blockerIndex].friendRequestReceivedIds = state.members[blockerIndex].friendRequestReceivedIds?.filter((id) => id !== blockedId) || [];
          state.members[blockerIndex].likedUserIds = state.members[blockerIndex].likedUserIds?.filter((id) => id !== blockedId) || [];
          state.members[blockerIndex].likerUserIds = state.members[blockerIndex].likerUserIds?.filter((id) => id !== blockedId) || [];
        }

        const blockedIndex = state.members.findIndex((m) => m.id === blockedId);
        if (blockedIndex !== -1) {
          state.members[blockedIndex].friendIds = state.members[blockedIndex].friendIds?.filter((id) => id !== blockerId) || [];
          state.members[blockedIndex].friendRequestSentIds = state.members[blockedIndex].friendRequestSentIds?.filter((id) => id !== blockerId) || [];
          state.members[blockedIndex].friendRequestReceivedIds = state.members[blockedIndex].friendRequestReceivedIds?.filter((id) => id !== blockerId) || [];
          state.members[blockedIndex].likedUserIds = state.members[blockedIndex].likedUserIds?.filter((id) => id !== blockerId) || [];
          state.members[blockedIndex].likerUserIds = state.members[blockedIndex].likerUserIds?.filter((id) => id !== blockerId) || [];
        }

        state.message = "Utilisateur bloqué avec succès !";
        state.error = null;
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(unblockUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(unblockUser.fulfilled, (state, action: PayloadAction<{ blockerId: string; blockedId: string }>) => {
        state.status = "succeeded";
        const { blockerId, blockedId } = action.payload;

        if (state.user && state.user.id === blockerId) {
          state.user.blockedUserIds = state.user.blockedUserIds?.filter((id) => id !== blockedId) || [];
        }

        const blockerIndex = state.members.findIndex((m) => m.id === blockerId);
        if (blockerIndex !== -1) {
          state.members[blockerIndex].blockedUserIds =
            state.members[blockerIndex].blockedUserIds?.filter((id) => id !== blockedId) || [];
        }

        state.message = "Utilisateur débloqué avec succès !";
        state.error = null;
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const userSocialReducer = userSocialSlice.reducer;