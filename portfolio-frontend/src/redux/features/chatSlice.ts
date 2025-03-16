// portfolio-frontend/src/redux/features/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Message {
  id: string;
  type: "private" | "group_message";
  fromUserId: string;
  toUserId?: string;
  groupId?: string;
  chatId: string;
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  groups: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  webSocket: WebSocket | null;
  theme: string;
}

const initialState: ChatState = {
  messages: [],
  groups: [],
  status: "idle",
  error: null,
  webSocket: null,
  theme: "light", // Par défaut : light
};

const normalizeTimestamp = (timestamp: any): string => {
  if (typeof timestamp === "string" && timestamp.includes("Z")) {
    return timestamp;
  }
  console.warn("⚠️ Timestamp invalide reçu:", timestamp);
  return new Date().toISOString();
};

export const fetchAllConversations = createAsyncThunk(
  "chat/fetchAllConversations",
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📥 Fetched all conversations (raw):", response.data);
      const normalizedMessages = response.data.map((msg: Message) => ({
        ...msg,
        chatId: msg.chatId || `temp-${msg.fromUserId}-${msg.toUserId}`,
        timestamp: normalizeTimestamp(msg.timestamp),
      }));
      return normalizedMessages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch conversations");
    }
  }
);

export const fetchPrivateMessages = createAsyncThunk(
  "chat/fetchPrivateMessages",
  async (otherUserId: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/private/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalizedMessages = response.data.map((msg: Message) => ({
        ...msg,
        chatId: msg.chatId,
        timestamp: normalizeTimestamp(msg.timestamp),
      }));
      return normalizedMessages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch private messages");
    }
  }
);

export const fetchGroupMessages = createAsyncThunk(
  "chat/fetchGroupMessages",
  async (groupId: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    try {
      const response = await axios.get(`${BASE_URL}/api/chat/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalizedMessages = response.data.map((msg: Message) => ({
        ...msg,
        chatId: msg.chatId || groupId,
        timestamp: normalizeTimestamp(msg.timestamp),
      }));
      return normalizedMessages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch group messages");
    }
  }
);

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
      return {
        ...response.data,
        timestamp: normalizeTimestamp(response.data.timestamp),
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to update message");
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (id: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.token;
    if (id.startsWith("temp-")) {
      console.log(`ℹ️ Suppression locale d'un message temporaire: ${id}`);
      return id;
    }
    try {
      console.log(`🔍 Tentative de suppression du message avec ID: ${id}`);
      await axios.delete(`${BASE_URL}/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ Message supprimé avec succès: ${id}`);
      return id;
    } catch (error: any) {
      console.error(`❌ Erreur lors de la suppression du message ${id}:`, error.response?.data || error.message);
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
      const existingIndex = state.messages.findIndex((msg) => msg.id === action.payload.id);
      if (existingIndex === -1) {
        state.messages.push(action.payload);
      } else {
        state.messages[existingIndex] = action.payload;
      }
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
    setChatTheme: (state, action: PayloadAction<string>) => {
      state.theme = ["light", "dark"].includes(action.payload) ? action.payload : "light";
    },
    resetMessages: (state) => {
      state.messages = [];
      state.groups = [];
      state.status = "idle";
      state.theme = "light";
      console.log("🔍 Messages et thème réinitialisés dans le store");
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
        action.payload.forEach((msg) => {
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
        const newMessages = action.payload;
        newMessages.forEach((newMsg) => {
          const existingIndex = state.messages.findIndex((msg) => msg.id === newMsg.id);
          if (existingIndex === -1) {
            state.messages.push(newMsg);
          } else {
            state.messages[existingIndex] = newMsg;
          }
        });
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
        const newMessages = action.payload;
        newMessages.forEach((newMsg) => {
          const existingIndex = state.messages.findIndex((msg) => msg.id === newMsg.id);
          if (existingIndex === -1) {
            state.messages.push(newMsg);
          } else {
            state.messages[existingIndex] = newMsg;
          }
        });
        if (!state.groups.includes(action.payload[0]?.groupId || "")) {
          state.groups.push(action.payload[0]?.groupId || "");
        }
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
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        if (action.meta.arg.startsWith("temp-")) {
          state.messages = state.messages.filter((msg) => msg.id !== action.meta.arg);
          console.log(`ℹ️ Message temporaire ${action.meta.arg} supprimé localement malgré l'échec`);
        }
      });
  },
});

export const { setWebSocket, addMessage, updateMessageInState, removeMessage, addGroup, setChatTheme, resetMessages } =
  chatSlice.actions;
export default chatSlice.reducer;