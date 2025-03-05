// src/redux/features/notificationSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid"; // Ajout pour générer des IDs uniques

export interface Notification {
  id: string;
  type: "new_message" | "new_group_message" | "friend_request" | "friend_request_accepted" | "contact_request" | "contact_accepted";
  message: string;
  timestamp: string;
  chatId?: string;
  groupId?: string;
  fromUserId?: string;
  requestId?: string;
  isRead?: boolean;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      const newNotification = {
        ...action.payload,
        id: action.payload.id || uuidv4(), // Utilise un ID unique si non fourni
        isRead: action.payload.isRead ?? false,
      };
      state.notifications.push(newNotification);
      console.log("🔔 Nouvelle notification ajoutée:", newNotification);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      console.log("🔔 Notifications effacées");
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      console.log("🔔 Notification supprimée avec ID:", action.payload);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
        console.log("🔔 Notification marquée comme lue:", notification);
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      console.log("🔔 Toutes les notifications marquées comme lues");
    },
  },
});

export const { addNotification, clearNotifications, removeNotification, markNotificationAsRead, markAllNotificationsAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;