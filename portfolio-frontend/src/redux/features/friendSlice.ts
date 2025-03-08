// src/redux/features/friendSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

// Interface pour représenter un ami ou une demande d'ami
interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl: string | null;
}

// Interface pour l'état du slice
interface FriendState {
  friends: Friend[];
  sentRequests: Friend[];
  receivedRequests: Friend[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
}

const initialState: FriendState = {
  friends: [],
  sentRequests: [],
  receivedRequests: [],
  status: "idle",
  error: null,
  message: null,
};

const getAuthToken = () => localStorage.getItem("token");

export const sendFriendRequest = createAsyncThunk(
  "friend/sendFriendRequest",
  async (
    { senderId, receiverId }: { senderId: string; receiverId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.post<string>(
        `${BASE_URL}/api/friends/request/${senderId}/${receiverId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Demande d'ami envoyée:", response.data);
      await dispatch(fetchSentFriendRequests(senderId));
      return { receiverId };
    } catch (error: any) {
      console.error("❌ Échec de sendFriendRequest:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de l'envoi de la demande d'ami.");
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  "friend/acceptFriendRequest",
  async (
    { userId, friendId }: { userId: string; friendId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.post<string>(
        `${BASE_URL}/api/friends/accept/${userId}/${friendId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Demande d'ami acceptée:", response.data);
      await dispatch(fetchFriends(userId));
      await dispatch(fetchReceivedFriendRequests(userId));
      return { friendId };
    } catch (error: any) {
      console.error("❌ Échec de acceptFriendRequest:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de l'acceptation de la demande d'ami.");
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  "friend/rejectFriendRequest",
  async (
    { userId, friendId }: { userId: string; friendId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.post<string>(
        `${BASE_URL}/api/friends/reject/${userId}/${friendId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Demande d'ami refusée:", response.data);
      await dispatch(fetchReceivedFriendRequests(userId));
      return { friendId };
    } catch (error: any) {
      console.error("❌ Échec de rejectFriendRequest:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du refus de la demande d'ami.");
    }
  }
);

export const removeFriend = createAsyncThunk(
  "friend/removeFriend",
  async (
    { userId, friendId }: { userId: string; friendId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.delete<string>(
        `${BASE_URL}/api/friends/remove/${userId}/${friendId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Ami supprimé:", response.data);
      await dispatch(fetchFriends(userId));
      return { friendId };
    } catch (error: any) {
      console.error("❌ Échec de removeFriend:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de l'ami.");
    }
  }
);

export const cancelFriendRequest = createAsyncThunk(
  "friend/cancelFriendRequest",
  async (
    { senderId, receiverId }: { senderId: string; receiverId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.delete<string>(
        `${BASE_URL}/api/friends/cancel/${senderId}/${receiverId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Demande d'ami annulée:", response.data);
      await dispatch(fetchSentFriendRequests(senderId));
      return { receiverId };
    } catch (error: any) {
      console.error("❌ Échec de cancelFriendRequest:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de l'annulation de la demande d'ami.");
    }
  }
);

export const fetchFriends = createAsyncThunk(
  "friend/fetchFriends",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Friend[]>(
        `${BASE_URL}/api/friends/${userId}/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Liste des amis récupérée:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de fetchFriends:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des amis.");
    }
  }
);

export const fetchSentFriendRequests = createAsyncThunk(
  "friend/fetchSentFriendRequests",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Friend[]>(
        `${BASE_URL}/api/friends/${userId}/sent`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Demandes d'amis envoyées récupérées:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de fetchSentFriendRequests:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des demandes envoyées.");
    }
  }
);

export const fetchReceivedFriendRequests = createAsyncThunk(
  "friend/fetchReceivedFriendRequests",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Friend[]>(
        `${BASE_URL}/api/friends/${userId}/received`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Demandes d'amis reçues récupérées:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de fetchReceivedFriendRequests:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des demandes reçues.");
    }
  }
);

const friendSlice = createSlice({
  name: "friend",
  initialState,
  reducers: {
    clearFriendState: (state) => {
      state.friends = [];
      state.sentRequests = [];
      state.receivedRequests = [];
      state.status = "idle";
      state.error = null;
      state.message = null;
    },
    clearFriendMessages: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendFriendRequest.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action: PayloadAction<{ receiverId: string }>) => {
        state.status = "succeeded";
        state.message = "Demande d'ami envoyée avec succès !";
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(acceptFriendRequest.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action: PayloadAction<{ friendId: string }>) => {
        state.status = "succeeded";
        state.message = "Demande d'ami acceptée avec succès !";
        const friendId = action.payload.friendId;
        state.friends.push({
          id: friendId,
          firstName: "",
          lastName: "",
          email: "",
          profilePictureUrl: null,
        });
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(rejectFriendRequest.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action: PayloadAction<{ friendId: string }>) => {
        state.status = "succeeded";
        state.message = "Demande d'ami refusée avec succès !";
      })
      .addCase(rejectFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(removeFriend.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(removeFriend.fulfilled, (state, action: PayloadAction<{ friendId: string }>) => {
        state.status = "succeeded";
        state.message = "Ami supprimé avec succès !";
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(cancelFriendRequest.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(cancelFriendRequest.fulfilled, (state, action: PayloadAction<{ receiverId: string }>) => {
        state.status = "succeeded";
        state.message = "Demande d'ami annulée avec succès !";
      })
      .addCase(cancelFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchFriends.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action: PayloadAction<Friend[]>) => {
        state.status = "succeeded";
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchSentFriendRequests.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(fetchSentFriendRequests.fulfilled, (state, action: PayloadAction<Friend[]>) => {
        state.status = "succeeded";
        state.sentRequests = action.payload;
      })
      .addCase(fetchSentFriendRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchReceivedFriendRequests.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(fetchReceivedFriendRequests.fulfilled, (state, action: PayloadAction<Friend[]>) => {
        state.status = "succeeded";
        state.receivedRequests = action.payload;
      })
      .addCase(fetchReceivedFriendRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearFriendState, clearFriendMessages } = friendSlice.actions;
export default friendSlice.reducer;