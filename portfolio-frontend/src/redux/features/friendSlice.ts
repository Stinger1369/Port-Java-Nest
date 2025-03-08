import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl: string | null;
}

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
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.post<string>(
        `${BASE_URL}/api/friends/request/${senderId}/${receiverId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Demande d'ami envoyée:", response.data);
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
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.post<string>(
        `${BASE_URL}/api/friends/accept/${userId}/${friendId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Demande d'ami acceptée:", response.data);
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
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.post<string>(
        `${BASE_URL}/api/friends/reject/${userId}/${friendId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Demande d'ami refusée:", response.data);
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
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.delete<string>(
        `${BASE_URL}/api/friends/remove/${userId}/${friendId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Ami supprimé:", response.data);
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
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.delete<string>(
        `${BASE_URL}/api/friends/cancel/${senderId}/${receiverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Demande d'ami annulée:", response.data);
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Demandes d'amis reçues récupérées:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de fetchReceivedFriendRequests:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des demandes reçues.");
    }
  }
);

export const fetchUserById = createAsyncThunk(
  "friend/fetchUserById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Friend>(
        `${BASE_URL}/api/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Détails de l'utilisateur récupérés:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de fetchUserById:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des détails de l'utilisateur.");
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
    addSentRequest: (state, action: PayloadAction<Friend>) => {
      const existingRequest = state.sentRequests.find((req) => req.id === action.payload.id);
      if (!existingRequest) {
        state.sentRequests.push(action.payload);
        console.log("✅ Demande d'ami envoyée ajoutée à sentRequests:", action.payload.id, "Nouvel état:", state.sentRequests);
      }
    },
    addReceivedRequest: (state, action: PayloadAction<Friend>) => {
      const existingRequest = state.receivedRequests.find((req) => req.id === action.payload.id);
      if (!existingRequest) {
        state.receivedRequests.push(action.payload);
        console.log("✅ Demande d'ami reçue ajoutée à receivedRequests:", action.payload, "Nouvel état:", state.receivedRequests);
      }
    },
    removeSentRequest: (state, action: PayloadAction<string>) => {
      state.sentRequests = state.sentRequests.filter((req) => req.id !== action.payload);
      console.log("✅ Demande d'ami envoyée supprimée de sentRequests:", action.payload, "Nouvel état:", state.sentRequests);
    },
    removeReceivedRequest: (state, action: PayloadAction<string>) => {
      state.receivedRequests = state.receivedRequests.filter((req) => req.id !== action.payload);
      console.log("✅ Demande d'ami reçue supprimée de receivedRequests:", action.payload, "Nouvel état:", state.receivedRequests);
    },
    addFriend: (state, action: PayloadAction<Friend>) => {
      const existingFriend = state.friends.find((friend) => friend.id === action.payload.id);
      if (!existingFriend) {
        state.friends.push(action.payload);
        console.log("✅ Ami ajouté à friends:", action.payload.id, "Nouvel état:", state.friends);
      }
    },
    removeFriendFromList: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter((friend) => friend.id !== action.payload);
      console.log("✅ Ami supprimé de friends:", action.payload, "Nouvel état:", state.friends);
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
        // Ne pas ajouter à sentRequests ici, car WebSocket le fera
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
        // Ne pas modifier l'état ici, WebSocket gère l'ajout à friends et la suppression de receivedRequests
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
        // Ne pas modifier l'état ici, WebSocket gère la suppression de receivedRequests
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
        // Ne pas modifier l'état ici, WebSocket gère la suppression de friends
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
        // Ne pas modifier l'état ici, WebSocket gère la suppression de sentRequests
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
        console.log("✅ receivedRequests mis à jour depuis le backend:", state.receivedRequests);
      })
      .addCase(fetchReceivedFriendRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<Friend>) => {
        console.log("✅ Détails de l'utilisateur récupérés pour mise à jour:", action.payload.id);
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearFriendState,
  clearFriendMessages,
  addSentRequest,
  addReceivedRequest,
  removeSentRequest,
  removeReceivedRequest,
  addFriend,
  removeFriendFromList,
} = friendSlice.actions;
export default friendSlice.reducer;