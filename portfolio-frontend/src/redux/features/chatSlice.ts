import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Message {
  id: string;
  type: "private" | "group_message";
  fromUserId: string;
  toUserId?: string;
  groupId?: string;
  chatId?: string;
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  groups: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  webSocket: WebSocket | null;
}

const initialState: ChatState = {
  messages: [],
  groups: [],
  status: "idle",
  error: null,
  webSocket: null,
};

// Fonction pour normaliser les timestamps des messages
// Maintenant que le backend renvoie des chaînes ISO, cette fonction est simplifiée
const normalizeTimestamp = (timestamp: any): string => {
  // Vérifie si timestamp est une chaîne ISO valide (contenant "Z")
  if (typeof timestamp === "string" && timestamp.includes("Z")) {
    return timestamp; // Format ISO, déjà correct
  }
  // Fallback à la date actuelle si le timestamp est invalide
  console.warn("⚠️ Timestamp invalide reçu:", timestamp);
  return new Date().toISOString();
};

// Récupérer toutes les conversations
export const fetchAllConversations = createAsyncThunk(
  "chat/fetchAllConversations",
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📥 Fetched all conversations (raw):", response.data);
      // Log des timestamps bruts pour inspection
      console.log("🔍 Timestamps bruts dans fetchAllConversations:", response.data.map((msg: any) => msg.timestamp));
      // Normaliser les timestamps avant de retourner les messages
      const normalizedMessages = response.data.map((msg: Message) => ({
        ...msg,
        timestamp: normalizeTimestamp(msg.timestamp),
      }));
      console.log("🔍 Messages normalisés dans fetchAllConversations:", normalizedMessages);
      return normalizedMessages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch conversations");
    }
  }
);

// Récupérer les messages privés avec un utilisateur
export const fetchPrivateMessages = createAsyncThunk(
  "chat/fetchPrivateMessages",
  async (otherUserId: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/private/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📥 Fetched private messages for user", otherUserId, " (raw):", response.data);
      // Log des timestamps bruts
      console.log("🔍 Timestamps bruts dans fetchPrivateMessages:", response.data.map((msg: any) => msg.timestamp));
      // Normaliser les timestamps
      const normalizedMessages = response.data.map((msg: Message) => ({
        ...msg,
        timestamp: normalizeTimestamp(msg.timestamp),
      }));
      console.log("🔍 Messages normalisés dans fetchPrivateMessages:", normalizedMessages);
      return normalizedMessages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch private messages");
    }
  }
);

// Récupérer les messages d’un groupe
export const fetchGroupMessages = createAsyncThunk(
  "chat/fetchGroupMessages",
  async (groupId: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📥 Fetched group messages for group", groupId, " (raw):", response.data);
      // Log des timestamps bruts
      console.log("🔍 Timestamps bruts dans fetchGroupMessages:", response.data.map((msg: any) => msg.timestamp));
      // Normaliser les timestamps
      const normalizedMessages = response.data.map((msg: Message) => ({
        ...msg,
        timestamp: normalizeTimestamp(msg.timestamp),
      }));
      console.log("🔍 Messages normalisés dans fetchGroupMessages:", normalizedMessages);
      return normalizedMessages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch group messages");
    }
  }
);

// Modifier un message
export const updateMessage = createAsyncThunk(
  "chat/updateMessage",
  async ({ id, content }: { id: string; content: string }, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.put(
        `${BASE_URL}/api/chat/${id}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Normaliser le timestamp du message modifié
      return {
        ...response.data,
        timestamp: normalizeTimestamp(response.data.timestamp),
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to update message");
    }
  }
);

// Supprimer un message
export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (id: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      await axios.delete(`${BASE_URL}/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete message");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setWebSocket: (state, action: PayloadAction<WebSocket | null>) => {
      state.webSocket = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateMessageInState: (state, action: PayloadAction<Message>) => {
      const index = state.messages.findIndex((msg) => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter((msg) => msg.id !== action.payload);
    },
    addGroup: (state, action: PayloadAction<string>) => {
      if (!state.groups.includes(action.payload)) {
        state.groups.push(action.payload);
      }
    },
    resetMessages: (state) => {
      state.messages = [];
      state.groups = [];
      state.status = "idle";
      console.log("🔍 Messages réinitialisés dans le store");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllConversations.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.status = "succeeded";
        state.messages = action.payload;
        action.payload.forEach(msg => {
          if (msg.type === "group_message" && msg.groupId && !state.groups.includes(msg.groupId)) {
            state.groups.push(msg.groupId);
          }
        });
      })
      .addCase(fetchAllConversations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchPrivateMessages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPrivateMessages.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.status = "succeeded";
        state.messages = action.payload;
      })
      .addCase(fetchPrivateMessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchGroupMessages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.status = "succeeded";
        state.messages = action.payload;
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        const index = state.messages.findIndex((msg) => msg.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<string>) => {
        state.messages = state.messages.filter((msg) => msg.id !== action.payload);
      });
  },
});

export const { setWebSocket, addMessage, updateMessageInState, removeMessage, addGroup, resetMessages } = chatSlice.actions;
export default chatSlice.reducer;