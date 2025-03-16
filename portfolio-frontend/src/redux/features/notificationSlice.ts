// portfolio-frontend/src/redux/features/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState pour accéder au state

interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data?: Record<string, string>;
}

interface NotificationState {
  notifications: Notification[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  status: "idle",
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token; // Utilise state.auth.token (alias de accessToken)
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      const response = await axios.get<Notification[]>(
        `${BASE_URL}/api/notifications/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const normalizedNotifications = response.data.map((notif) => ({
        ...notif,
        timestamp: notif.timestamp ? new Date(notif.timestamp).toISOString() : new Date().toISOString(),
      }));
      return normalizedNotifications;
    } catch (error: any) {
      console.error("❌ Échec de fetchNotifications:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch notifications");
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notification/markAsRead",
  async ({ notificationId, userId }: { notificationId: string; userId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      await axios.put(
        `${BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { notificationId, userId };
    } catch (error: any) {
      console.error("❌ Échec de markNotificationAsRead:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to mark notification as read");
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  "notification/clearAllNotifications",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      const response = await axios.delete(`${BASE_URL}/api/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Suppression réussie - Réponse backend:", response);
      return userId;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression:", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to clear notifications");
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async ({ notificationId, userId }: { notificationId: string; userId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      await axios.delete(`${BASE_URL}/api/notifications/${userId}/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return notificationId;
    } catch (error: any) {
      console.error("❌ Échec de deleteNotification:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to delete notification");
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      const existingIndex = state.notifications.findIndex(
        (notif) => notif.id === action.payload.id
      );
      if (existingIndex === -1) {
        state.notifications.push(action.payload);
      } else {
        state.notifications[existingIndex] = action.payload;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex((notif) => notif.id === action.payload);
      if (index !== -1) {
        state.notifications[index].isRead = true;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notif) => notif.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    resetStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.status = "succeeded";
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const { notificationId } = action.payload;
        const index = state.notifications.findIndex((notif) => notif.id === notificationId);
        if (index !== -1) {
          state.notifications[index].isRead = true;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(clearAllNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(clearAllNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = [];
        console.log("✅ State mis à jour après suppression:", state);
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Échec de la suppression - Erreur:", state.error);
      })
      .addCase(deleteNotification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        console.log("🗑️ Redux: Notification supprimée de l’état:", action.meta.arg.notificationId);
        state.notifications = state.notifications.filter((notif) => notif.id !== action.payload);
        console.log("✅ Notification supprimée avec succès:", action.payload);
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Échec de la suppression de la notification:", state.error);
      });
  },
});

export const { addNotification, markAsRead, removeNotification, clearNotifications, resetStatus } = notificationSlice.actions;
export default notificationSlice.reducer;