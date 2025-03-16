// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { addMessage, addGroup } from "../redux/features/chatSlice";
import { addNotification } from "../redux/features/notificationSlice";
import { BASE_URL } from "../config/hostname";
import { v4 as uuidv4 } from "uuid";
import { handleFriendNotifications } from "./handleFriendNotifications";

export const useWebSocket = () => { // Suppression du paramètre `token`, car il est récupéré via useSelector
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token); // Récupérer le token depuis le state Redux
  const userId = useSelector((state: RootState) => state.auth.userId);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const { friends, sentRequests, receivedRequests } = useSelector((state: RootState) => state.friend);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const normalizeTimestamp = (timestamp: any): string => {
    if (timestamp?.$date) return timestamp.$date;
    if (typeof timestamp === "string" && timestamp.includes("Z")) return timestamp;
    if (timestamp instanceof Date) return timestamp.toISOString();
    console.warn("⚠️ Timestamp invalide:", timestamp);
    return new Date().toISOString();
  };

  const connectWebSocket = () => {
    if (!token) {
      console.error("🔴 Pas de token, connexion impossible pour userId:", userId);
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔵 WebSocket déjà connecté pour userId:", userId);
      return;
    }

    const wsUrl = `${BASE_URL.replace("https", "wss").replace("http", "ws")}/chat?token=${token}`;
    console.log("🔧 Connexion WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connecté pour userId:", userId, "URL:", wsUrl);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("📥 Message WebSocket reçu pour userId:", userId, "Message:", message);

      const normalizedTimestamp = normalizeTimestamp(message.timestamp || new Date());
      const normalizedMessage = {
        ...message,
        id: message.id || message._id || uuidv4(),
        timestamp: normalizedTimestamp,
        chatId: message.chatId || (message.toUserId ? `${message.fromUserId}-${message.toUserId}` : message.groupId),
        userId: message.userId || userId || "",
        type: message.type || "notification",
        notificationType: message.notificationType || message.type,
        data: message.data || {},
      };

      if (normalizedMessage.type === "notification" || normalizedMessage.notificationType) {
        if (message.message && message.notificationType !== "connected") {
          dispatch(addNotification({
            id: normalizedMessage.id,
            userId: normalizedMessage.userId,
            type: normalizedMessage.notificationType,
            message: message.message,
            timestamp: normalizedTimestamp,
            isRead: message.isRead || false,
            data: normalizedMessage.data,
          }));
          console.log("✅ Notification spécifique ajoutée:", normalizedMessage.notificationType);
        }

        const fromUserId = message.fromUserId || message.data?.fromUserId || "";
        const toUserId = message.toUserId || message.data?.toUserId || "";
        const explicitFriendId = message.friendId || message.data?.friendId || "";

        let friendId;
        switch (normalizedMessage.notificationType) {
          case "friend_request_canceled":
          case "friend_request_rejected":
          case "friend_request_accepted":
            if (userId === fromUserId) {
              friendId = toUserId || explicitFriendId;
            } else {
              friendId = fromUserId;
            }
            if (!friendId && !toUserId && !explicitFriendId) {
              console.warn("⚠️ toUserId et friendId manquants, déduction impossible:", message);
              friendId = userId === fromUserId ? "" : fromUserId;
            }
            break;

          case "friend_removed":
            friendId = explicitFriendId || (userId === fromUserId ? toUserId : fromUserId);
            if (!friendId) {
              console.warn("⚠️ friendId ou toUserId manquant, tentative de déduction:", message);
              friendId = userId === fromUserId ? "" : fromUserId;
            }
            break;

          default:
            friendId = userId === fromUserId ? toUserId : fromUserId;
        }

        if (!friendId && (normalizedMessage.notificationType === "friend_request_received" ||
                          normalizedMessage.notificationType === "friend_request_accepted" ||
                          normalizedMessage.notificationType === "friend_request_rejected" ||
                          normalizedMessage.notificationType === "friend_removed" ||
                          normalizedMessage.notificationType === "friend_request_canceled")) {
          console.error("❌ friendId non déterminé après secours:", message);
          return;
        }

        const friendData = {
          id: friendId || "",
          firstName: message.firstName || message.data?.firstName || "",
          lastName: message.lastName || message.data?.lastName || "",
          email: message.email || message.data?.email || "",
          profilePictureUrl: message.profilePictureUrl || message.data?.profilePictureUrl || null,
        };

        handleFriendNotifications(
          dispatch,
          userId,
          normalizedMessage.notificationType,
          fromUserId,
          toUserId,
          friendId,
          friendData,
          sentRequests,
          receivedRequests,
          friends
        );

        if (normalizedMessage.notificationType === "user_like" && userId === normalizedMessage.userId) {
          dispatch(addNotification({
            id: normalizedMessage.id,
            userId: normalizedMessage.userId,
            type: "user_like",
            message: message.message || "Quelqu’un a aimé votre profil !",
            timestamp: normalizedTimestamp,
            isRead: false,
            data: normalizedMessage.data,
          }));
          console.log("✅ Notification user_like ajoutée:", normalizedMessage);
        } else if (normalizedMessage.notificationType === "user_unlike" && userId === normalizedMessage.userId) {
          dispatch(addNotification({
            id: normalizedMessage.id,
            userId: normalizedMessage.userId,
            type: "user_unlike",
            message: message.message || "Quelqu’un a retiré son like de votre profil !",
            timestamp: normalizedTimestamp,
            isRead: false,
            data: normalizedMessage.data,
          }));
          console.log("✅ Notification user_unlike ajoutée:", normalizedMessage);
        } else if (normalizedMessage.notificationType === "connected") {
          console.log("✅ Connexion WebSocket confirmée pour userId:", userId);
        }
      } else if (message.type === "private" || message.type === "group_message") {
        const isDuplicate = messages.some((msg) => msg.id === normalizedMessage.id);
        if (!isDuplicate) {
          dispatch(addMessage(normalizedMessage));
          console.log("✅ Message chat ajouté:", normalizedMessage);

          const isRecipient = message.type === "private"
            ? message.toUserId === userId && message.fromUserId !== userId
            : message.type === "group_message" && message.fromUserId !== userId;

          if (isRecipient) {
            const notificationType = message.type === "private" ? "new_private_message" : "new_group_message";
            const notificationMessage = message.type === "private"
              ? `Nouveau message de ${message.fromUserId}`
              : `Nouveau message dans le groupe ${message.groupId}`;

            dispatch(addNotification({
              id: `msg-${normalizedMessage.id}`,
              userId: userId || "",
              type: notificationType,
              message: notificationMessage,
              timestamp: normalizedTimestamp,
              isRead: false,
              data: message.type === "private"
                ? { chatId: normalizedMessage.chatId, fromUserId: message.fromUserId }
                : { groupId: message.groupId, fromUserId: message.fromUserId },
            }));
            console.log("✅ Notification chat ajoutée:", notificationType);
          }
        }
      } else if (message.type === "group_invite") {
        dispatch(addGroup(message.groupId));
        console.log("✅ Invitation groupe ajoutée:", message.groupId);
      } else if (message.type === "message_sent") {
        const localMessage = {
          id: normalizedMessage.id,
          type: "private",
          fromUserId: userId!,
          toUserId: message.toUserId || "",
          chatId: normalizedMessage.chatId,
          content: message.content || "",
          timestamp: normalizedTimestamp,
        };
        if (!messages.some((msg) => msg.id === localMessage.id)) {
          dispatch(addMessage(localMessage));
          console.log("✅ Message envoyé ajouté:", localMessage);
        }
      } else if (message.error) {
        console.error("⚠️ Erreur serveur:", message.error);
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket déconnecté:", event.reason, "Code:", event.code);
      setWsInstance(null);
      wsRef.current = null;
      setTimeout(() => token && connectWebSocket(), 2000);
    };

    ws.onerror = (error) => {
      console.error("⚠️ Erreur WebSocket:", error);
    };
  };

  useEffect(() => {
    if (!token) return;
    connectWebSocket();
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [token, userId]);

  return { wsInstance, connectWebSocket };
};