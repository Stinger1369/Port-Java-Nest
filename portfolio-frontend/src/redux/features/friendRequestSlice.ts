import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { removeNotification } from "./notificationSlice";
import { fetchFriends } from "./friendRequestSlice"; // Ajout pour mettre à jour la liste des amis

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  sex: string;
  slug: string;
  bio: string;
  birthdate: string;
  showBirthdate: boolean;
  age: number;
  likedUserIds: string[];
  likerUserIds: string[];
  latitude: string | null;
  longitude: string | null;
  chatIds: string[];
}

interface FriendRequestState {
  pendingReceivedRequests: FriendRequest[];
  pendingSentRequests: FriendRequest[];
  friends: User[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: FriendRequestState = {
  pendingReceivedRequests: [],
  pendingSentRequests: [],
  friends: [],
  status: "idle",
  error: null,
};

export const sendFriendRequest = createAsyncThunk(
  "friendRequest/sendFriendRequest",
  async ({ senderId, receiverId }: { senderId: string; receiverId: string }, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/friend-requests/send`,
        null,
        {
          params: { senderId, receiverId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to send friend request");
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  "friendRequest/acceptFriendRequest",
  async (requestId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const userId = (getState() as any).auth.userId || localStorage.getItem("userId"); // Récupérer l'ID utilisateur
      const response = await axios.put(
        `${BASE_URL}/api/friend-requests/accept/${requestId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(removeNotification(requestId));
      // Mettre à jour la liste des amis après acceptation
      if (userId) {
        dispatch(fetchFriends(userId));
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to accept friend request";
      console.error("❌ Erreur lors de l'acceptation de la demande d'ami:", message);
      return rejectWithValue(message);
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  "friendRequest/rejectFriendRequest",
  async (requestId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/friend-requests/reject/${requestId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(removeNotification(requestId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to reject friend request");
    }
  }
);

export const cancelFriendRequest = createAsyncThunk(
  "friendRequest/cancelFriendRequest",
  async (requestId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/friend-requests/cancel/${requestId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(removeNotification(requestId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to cancel friend request");
    }
  }
);

export const removeFriend = createAsyncThunk(
  "friendRequest/removeFriend",
  async ({ userId, friendId }: { userId: string; friendId: string }, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.delete(
        `${BASE_URL}/api/friend-requests/remove-friend`,
        {
          params: { userId, friendId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { friendId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove friend");
    }
  }
);

export const fetchPendingReceivedFriendRequests = createAsyncThunk(
  "friendRequest/fetchPendingReceivedFriendRequests",
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/friend-requests/pending/received/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch pending received friend requests");
    }
  }
);

export const fetchPendingSentFriendRequests = createAsyncThunk(
  "friendRequest/fetchPendingSentFriendRequests",
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/friend-requests/pending/sent/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch pending sent friend requests");
    }
  }
);

export const fetchFriends = createAsyncThunk(
  "friendRequest/fetchFriends",
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token || localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/friend-requests/${userId}/friends`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch friends list");
    }
  }
);

const friendRequestSlice = createSlice({
  name: "friendRequest",
  initialState,
  reducers: {
    clearFriendRequestError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendFriendRequest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(sendFriendRequest.fulfilled, (state, action: PayloadAction<FriendRequest>) => {
        state.status = "succeeded";
        state.pendingSentRequests.push(action.payload);
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(acceptFriendRequest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action: PayloadAction<FriendRequest>) => {
        state.status = "succeeded";
        state.pendingReceivedRequests = state.pendingReceivedRequests.filter(
          (req) => req.id !== action.payload.id
        );
        // La liste des amis est mise à jour via fetchFriends dans le thunk
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(rejectFriendRequest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action: PayloadAction<FriendRequest>) => {
        state.status = "succeeded";
        state.pendingReceivedRequests = state.pendingReceivedRequests.filter(
          (req) => req.id !== action.payload.id
        );
      })
      .addCase(rejectFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(cancelFriendRequest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(cancelFriendRequest.fulfilled, (state, action: PayloadAction<FriendRequest>) => {
        state.status = "succeeded";
        state.pendingSentRequests = state.pendingSentRequests.filter(
          (req) => req.id !== action.payload.id
        );
      })
      .addCase(cancelFriendRequest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(removeFriend.pending, (state) => {
        state.status = "loading";
      })
      .addCase(removeFriend.fulfilled, (state, action: PayloadAction<{ friendId: string }>) => {
        state.status = "succeeded";
        state.friends = state.friends.filter((friend) => friend.id !== action.payload.friendId);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchPendingReceivedFriendRequests.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPendingReceivedFriendRequests.fulfilled, (state, action: PayloadAction<FriendRequest[]>) => {
        state.status = "succeeded";
        state.pendingReceivedRequests = action.payload;
      })
      .addCase(fetchPendingReceivedFriendRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchPendingSentFriendRequests.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPendingSentFriendRequests.fulfilled, (state, action: PayloadAction<FriendRequest[]>) => {
        state.status = "succeeded";
        state.pendingSentRequests = action.payload;
      })
      .addCase(fetchPendingSentFriendRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchFriends.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFriends.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearFriendRequestError } = friendRequestSlice.actions;
export default friendRequestSlice.reducer;