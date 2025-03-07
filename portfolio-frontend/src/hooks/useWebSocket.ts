// useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { addMessage, addGroup } from "../redux/features/chatSlice";
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
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔴 Token absent ou WebSocket déjà connecté");
      return;
    }

    console.log("🔧 Établissement de la connexion WebSocket...");
    const ws = new WebSocket(`${BASE_URL.replace("http", "ws")}/chat?token=${token}`);
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connecté avec succès");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("📥 Message WebSocket reçu:", message);

      const normalizedTimestamp = normalizeTimestamp(message.timestamp || new Date().toISOString());
      const normalizedMessage = {
        ...message,
        id: message.id || Date.now().toString(), // Ajouter un ID si absent
        timestamp: normalizedTimestamp,
        chatId: message.chatId || selectedChatId || `temp-${message.toUserId}`, // S’assurer que chatId est défini
      };

      if (message.type === "private" || message.type === "group_message") {
        if (!messages.some((msg) => msg.id === normalizedMessage.id)) {
          dispatch(addMessage(normalizedMessage));
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
        console.log("⚠️ Erreur du serveur:", message.error);
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket déconnecté:", event.reason);
      setWsInstance(null);
      wsRef.current = null;
      setTimeout(() => {
        if (token) {
          console.log("🔄 Tentative de reconnexion WebSocket...");
          connectWebSocket();
        }
      }, 2000);
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
  }, [token]);

  return { wsInstance, connectWebSocket };
};