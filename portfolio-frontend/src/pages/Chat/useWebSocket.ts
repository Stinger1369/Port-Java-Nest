import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { addMessage, addGroup } from "../../redux/features/chatSlice";
import { BASE_URL } from "../../config/hostname";
import { normalizeTimestamp } from "./chatUtils";

const useWebSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { userId, messages } = useSelector((state: RootState) => state.auth);

  const connectWebSocket = useCallback(
    (token: string) => {
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

        // Normaliser le timestamp uniquement si le message en a besoin
        let normalizedMessage = { ...message };

        // Messages qui nécessitent un timestamp (private, group_message, message_sent)
        if (
          message.type === "private" ||
          message.type === "group_message" ||
          message.type === "message_sent"
        ) {
          const normalizedTimestamp = normalizeTimestamp(message.timestamp);
          normalizedMessage = { ...message, timestamp: normalizedTimestamp };
        }

        if (message.type === "private" || message.type === "group_message") {
          // Vérifier si le message existe déjà pour éviter les doublons
          if (!messages.some((msg) => msg.id === normalizedMessage.id)) {
            dispatch(addMessage(normalizedMessage));
          } else {
            console.log("ℹ️ Message déjà présent dans le state:", normalizedMessage.id);
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
            timestamp: normalizedMessage.timestamp, // Utilise le timestamp normalisé
          };
          console.log("📤 Ajout d’un message privé local (destinataire hors ligne):", localMessage);
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
            connectWebSocket(token);
          }
        }, 2000);
      };

      ws.onerror = (error) => {
        console.error("⚠️ Erreur WebSocket:", error);
      };
    },
    [dispatch, userId, messages]
  );

  return { wsInstance, connectWebSocket };
};

export default useWebSocket;