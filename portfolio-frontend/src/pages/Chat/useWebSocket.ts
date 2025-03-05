import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { addMessage, addGroup } from "../../redux/features/chatSlice";
import { addNotification } from "../../redux/features/notificationSlice";
import { fetchPendingSentFriendRequests, fetchPendingReceivedFriendRequests } from "../../redux/features/friendRequestSlice";
import { BASE_URL } from "../../config/hostname";
import { v4 as uuidv4 } from "uuid";

export const useWebSocket = (token: string | null) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId, messages } = useSelector((state: RootState) => state.chat);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const normalizeTimestamp = (timestamp: any): string => {
    if (typeof timestamp === "string" && timestamp.includes("Z")) {
      return timestamp;
    }
    console.warn("⚠️ Timestamp invalide reçu:", timestamp);
    return new Date().toISOString();
  };

  const connectWebSocket = () => {
    if (!token) {
      console.log("🔴 Token absent, connexion WebSocket impossible");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔴 WebSocket déjà connecté");
      return;
    }

    console.log("🔧 Établissement de la connexion WebSocket...");
    const ws = new WebSocket(`${BASE_URL.replace("http", "ws")}/chat?token=${token}`);
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connecté avec succès");
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("📥 Message WebSocket reçu:", message);

      const normalizedTimestamp = normalizeTimestamp(message.timestamp || new Date().toISOString());

      if (message.type === "notification") {
        const notification = {
          id: uuidv4(),
          type: message.notificationType,
          message: message.message,
          timestamp: normalizedTimestamp,
          chatId: message.chatId,
          groupId: message.groupId,
          fromUserId: message.fromUserId,
          requestId: message.requestId,
        };
        dispatch(addNotification(notification));

        if (message.notificationType === "friend_request_sent" && userId) {
          dispatch(fetchPendingSentFriendRequests(userId));
        } else if (message.notificationType === "friend_request_received" && userId) {
          dispatch(fetchPendingReceivedFriendRequests(userId));
        }
      } else if (message.type === "connected") {
        console.log("🔗 Connexion confirmée pour userId:", message.userId);
      } else {
        const normalizedMessage = {
          ...message,
          id: message.id || uuidv4(),
          timestamp: normalizedTimestamp,
          chatId: message.chatId || `temp-${message.toUserId || message.groupId}`,
        };

        if (message.type === "private" || message.type === "group_message") {
          if (!messages.some((msg) => msg.id === normalizedMessage.id)) {
            dispatch(addMessage(normalizedMessage));
          }
        } else if (message.type === "group_invite") {
          dispatch(addGroup(message.groupId));
        } else if (message.type === "message_sent") {
          const localMessage = {
            id: message.id || uuidv4(),
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
          console.log("⚠️ Erreur du serveur:", message.error);
          if (message.error.includes("Token invalide ou expiré")) {
            ws.close();
            dispatch({ type: "auth/logout" }); // Déconnexion si token invalide
          }
        }
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket déconnecté:", event.reason);
      setWsInstance(null);
      wsRef.current = null;
      if (reconnectAttempts.current < maxReconnectAttempts && token) {
        reconnectAttempts.current += 1;
        console.log(`🔄 Tentative de reconnexion WebSocket (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
        setTimeout(connectWebSocket, 2000 * reconnectAttempts.current);
      } else {
        console.log("🛑 Nombre maximum de tentatives de reconnexion atteint ou token invalide");
      }
    };

    ws.onerror = (error) => {
      console.error("⚠️ Erreur WebSocket:", error);
    };
  };

  const sendMessage = (toUserId: string, content: string, chatId: string, messageType: "private" | "group_message") => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      const message = {
        type: messageType,
        toUserId: messageType === "private" ? toUserId : undefined,
        groupId: messageType === "group_message" ? chatId : undefined,
        chatId,
        content,
      };
      wsInstance.send(JSON.stringify(message));
      console.log("📤 Message envoyé via WebSocket:", message);
    } else {
      console.error("❌ WebSocket non connecté, impossible d'envoyer le message");
      connectWebSocket();
    }
  };

  useEffect(() => {
    if (!token) return;

    connectWebSocket();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [token]);

  return { wsInstance, connectWebSocket, sendMessage };
};