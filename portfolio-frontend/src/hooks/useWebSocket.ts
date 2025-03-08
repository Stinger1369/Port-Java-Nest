// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { addMessage, addGroup } from "../redux/features/chatSlice";
import { addNotification } from "../redux/features/notificationSlice";
import { BASE_URL } from "../config/hostname";

export const useWebSocket = (token: string | null) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId, messages } = useSelector((state: RootState) => state.chat);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const normalizeTimestamp = (timestamp: any): string => {
    if (typeof timestamp === "string" && timestamp.includes("Z")) {
      return timestamp;
    }
    console.warn("⚠️ Timestamp invalide reçu:", timestamp);
    return new Date().toISOString();
  };

  const connectWebSocket = () => {
    if (!token) {
      console.error("🔴 Pas de token, connexion WebSocket impossible pour userId:", userId);
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔵 WebSocket déjà connecté pour userId:", userId, "ReadyState:", wsRef.current.readyState);
      return;
    }

    console.log("🔧 Tentative d'établissement de la connexion WebSocket avec URL:", `${BASE_URL.replace("http", "ws")}/chat?token=${token}`);
    const ws = new WebSocket(`${BASE_URL.replace("http", "ws")}/chat?token=${token}`);
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connecté avec succès pour userId:", userId, "Token utilisé:", token);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("📥 Message WebSocket reçu pour userId:", userId, "Message complet:", JSON.stringify(message, null, 2));

      const normalizedTimestamp = normalizeTimestamp(message.timestamp || new Date().toISOString());
      const normalizedMessage = {
        ...message,
        id: message.id || Date.now().toString(),
        timestamp: normalizedTimestamp,
        chatId: message.chatId || (message.toUserId ? `temp-${message.toUserId}` : message.groupId),
      };

      if (message.type === "notification") {
        console.log("📢 Notification reçue et ajoutée au state pour userId:", userId, "Notification:", normalizedMessage);
        dispatch(addNotification({
          id: normalizedMessage.id,
          userId: message.toUserId || userId || "",
          type: message.notificationType || message.type,
          message: message.message || "Nouvelle notification",
          timestamp: normalizedTimestamp,
          isRead: false,
          data: message.data || {},
        }));
      } else if (message.type === "private" || message.type === "group_message") {
        console.log("📩 Message reçu et traité pour userId:", userId, "Message:", normalizedMessage);
        if (!messages.some((msg) => msg.id === normalizedMessage.id)) {
          dispatch(addMessage(normalizedMessage));

          const isRecipient = message.type === "private"
            ? message.toUserId === userId
            : message.type === "group_message" && message.fromUserId !== userId;

          if (isRecipient) {
            const notificationType = message.type === "private" ? "new_private_message" : "new_group_message";
            const notificationMessage = message.type === "private"
              ? `Nouveau message privé de ${message.fromUserId}`
              : `Nouveau message dans le groupe ${message.groupId} de ${message.fromUserId}`;

            const isNewChat = !messages.some((msg) => msg.chatId === normalizedMessage.chatId);
            if (isNewChat && message.type === "private") {
              dispatch(addNotification({
                id: `new-chat-${normalizedMessage.id}`,
                userId: userId || "",
                type: "new_chat",
                message: `Nouveau chat démarré avec ${message.fromUserId}`,
                timestamp: normalizedTimestamp,
                isRead: false,
                data: { chatId: normalizedMessage.chatId, fromUserId: message.fromUserId },
              }));
            }

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
            console.log("📢 Notification locale ajoutée pour userId:", userId, "Type:", notificationType);
          }
        }
      } else if (message.type === "group_invite") {
        dispatch(addGroup(message.groupId));
      } else if (message.type === "message_sent") {
        const localMessage = {
          id: message.id || Date.now().toString(),
          type: "private",
          fromUserId: userId!,
          toUserId: message.toUserId,
          chatId: message.chatId,
          content: message.content,
          timestamp: normalizedTimestamp,
        };
        if (!messages.some((msg) => msg.id === localMessage.id)) {
          dispatch(addMessage(localMessage));
        }
      } else if (message.error) {
        console.error("⚠️ Erreur du serveur pour userId:", userId, "Erreur:", message.error);
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket déconnecté pour userId:", userId, "Raison:", event.reason, "Code:", event.code);
      setWsInstance(null);
      wsRef.current = null;
      setTimeout(() => {
        if (token) {
          console.log("🔄 Tentative de reconnexion WebSocket pour userId:", userId);
          connectWebSocket();
        }
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error("⚠️ Erreur WebSocket pour userId:", userId, "Erreur:", error);
    };
  };

  useEffect(() => {
    console.log("🔍 Initialisation de useWebSocket avec token:", token, "userId:", userId);
    if (!token) {
      console.error("🔴 Pas de token, connexion WebSocket impossible pour userId:", userId);
      return;
    }

    connectWebSocket();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("🔽 Fermeture de la connexion WebSocket pour userId:", userId);
        wsRef.current.close();
      }
    };
  }, [token, userId]); // Assure que la connexion se réinitialise si token ou userId change

  return { wsInstance, connectWebSocket };
};