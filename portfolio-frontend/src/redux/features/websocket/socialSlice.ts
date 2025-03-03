// src/redux/features/socialSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { websocketClient } from "../../../utils/websocketService";

interface SocialState {
  likes: { [userId: string]: string[] };
  members: any[]; // Liste des membres WebSocket
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: SocialState = {
  likes: {},
  members: [],
  loading: false,
  error: null,
  message: null,
};

// Action pour récupérer tous les utilisateurs WebSocket
export const fetchAllUsersFromWebSocket = createAsyncThunk(
  "social/fetchAllUsersFromWebSocket",
  async (_, { rejectWithValue }) => {
    return new Promise((resolve, reject) => {
      const messageHandler = (data: { type: string; payload: any }) => {
        if (data.type === "user.getAll.success") {
          console.log("✅ Tous les utilisateurs récupérés du WebSocket:", data.payload);
          websocketClient.removeListener(messageHandler);
          resolve(data.payload);
        } else if (data.type === "error") {
          console.error("Erreur lors de la récupération des utilisateurs:", data.payload.message);
          websocketClient.removeListener(messageHandler);
          reject(rejectWithValue(data.payload.message));
        }
      };

      websocketClient.addListener(messageHandler);
      websocketClient.send("user.getAll", {});
      console.log("Envoyé : user.getAll");

      setTimeout(() => {
        console.warn("Timeout: aucune réponse pour la récupération des utilisateurs");
        websocketClient.removeListener(messageHandler);
        reject(rejectWithValue("Timeout: aucune réponse du WebSocket"));
      }, 10000); // Augmenté à 10 secondes
    });
  }
);

// Action pour liker un utilisateur
export const likeUser = createAsyncThunk(
  "social/likeUser",
  async (
    { userId, targetUserId }: { userId: string; targetUserId: string },
    { rejectWithValue }
  ) => {
    return new Promise((resolve, reject) => {
      const messageHandler = (data: { type: string; payload: any }) => {
        if (data.type === "user.like.success" && data.payload.userId === userId && data.payload.entityId === targetUserId) {
          console.log("✅ Utilisateur liké avec succès:", data.payload);
          websocketClient.removeListener(messageHandler); // Retirer immédiatement
          resolve(data.payload);
        } else if (data.type === "error") {
          console.error("Erreur lors du like:", data.payload.message);
          websocketClient.removeListener(messageHandler); // Retirer immédiatement
          reject(rejectWithValue(data.payload.message));
        }
      };

      websocketClient.addListener(messageHandler);
      websocketClient.send("user.like", { userId, entityId: targetUserId, entityType: "USER" });

      setTimeout(() => {
        console.warn(`Timeout: aucune réponse pour le like de ${targetUserId} par ${userId}`);
        websocketClient.removeListener(messageHandler);
        reject(rejectWithValue("Timeout: aucune réponse du WebSocket"));
      }, 5000);
    });
  }
);

// Action pour récupérer les likes de l'utilisateur
export const fetchUserLikes = createAsyncThunk(
  "social/fetchUserLikes",
  async (userId: string, { rejectWithValue }) => {
    return new Promise((resolve, reject) => {
      const messageHandler = (data: { type: string; payload: any }) => {
        if (data.type === "like.getAllByUser.success") {
          console.log("✅ Likes récupérés pour l'utilisateur:", data.payload);
          websocketClient.removeListener(messageHandler);
          resolve(data.payload);
        } else if (data.type === "error") {
          console.error("Erreur lors de la récupération des likes:", data.payload.message);
          websocketClient.removeListener(messageHandler);
          reject(rejectWithValue(data.payload.message));
        }
      };

      websocketClient.addListener(messageHandler);
      websocketClient.send("like.getAllByUser", { userId });

      setTimeout(() => {
        console.warn(`Timeout: aucune réponse pour la récupération des likes de ${userId}`);
        websocketClient.removeListener(messageHandler);
        reject(rejectWithValue("Timeout: aucune réponse du WebSocket"));
      }, 5000);
    });
  }
);

const socialSlice = createSlice({
  name: "social",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsersFromWebSocket.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchAllUsersFromWebSocket.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
        state.message = "Utilisateurs récupérés avec succès !";
      })
      .addCase(fetchAllUsersFromWebSocket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(likeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(likeUser.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.meta.arg.userId;
        const targetUserId = action.meta.arg.targetUserId;
        state.likes[userId] = state.likes[userId] || [];
        if (!state.likes[userId].includes(targetUserId)) {
          state.likes[userId].push(targetUserId);
        }
        state.message = "Utilisateur liké avec succès !";
      })
      .addCase(likeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserLikes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchUserLikes.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.meta.arg;
        state.likes[userId] = action.payload.map((like: any) => like.entityId);
        state.message = "Likes récupérés avec succès !";
      })
      .addCase(fetchUserLikes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default socialSlice.reducer;