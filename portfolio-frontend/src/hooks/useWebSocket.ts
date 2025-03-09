// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { addMessage, addGroup } from "../redux/features/chatSlice";
import { addNotification } from "../redux/features/notificationSlice";
import {
  addSentRequest,
  addReceivedRequest,
  addFriend,
  removeReceivedRequest,
  removeSentRequest,
  removeFriendFromList,
} from "../redux/features/friendSlice";
import { BASE_URL } from "../config/hostname";
import { v4 as uuidv4 } from "uuid"; // Ajout d'uuid pour générer des identifiants uniques

export const useWebSocket = (token: string | null) => {
  const dispatch = useDispatch<AppDispatch>();
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

    console.log("🔧 Connexion WebSocket:", `${BASE_URL.replace("http", "ws")}/chat?token=${token}`);
    const ws = new WebSocket(`${BASE_URL.replace("http", "ws")}/chat?token=${token}`);
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connecté pour userId:", userId);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("📥 Message WebSocket reçu pour userId:", userId, "Message:", message);

      const normalizedTimestamp = normalizeTimestamp(message.timestamp || new Date());
      const normalizedMessage = {
        ...message,
        id: message.id || message._id || uuidv4(), // Utilisation d'uuidv4 au lieu de Date.now()
        timestamp: normalizedTimestamp,
        chatId: message.chatId || (message.toUserId ? `${message.fromUserId}-${message.toUserId}` : message.groupId),
        userId: message.userId || userId || "",
        type: message.type || "notification",
        notificationType: message.notificationType || message.type,
        data: message.data || {},
      };

      if (normalizedMessage.type === "notification" || normalizedMessage.notificationType) {
        dispatch(addNotification({
          id: normalizedMessage.id,
          userId: normalizedMessage.userId,
          type: normalizedMessage.notificationType,
          message: message.message || "Nouvelle notification",
          timestamp: normalizedTimestamp,
          isRead: message.isRead || false,
          data: normalizedMessage.data,
        }));

        const fromUserId = message.fromUserId || (message.data?.fromUserId ? message.data.fromUserId : "");
        const toUserId = message.toUserId || (message.data?.toUserId ? message.data.toUserId : "");
        const friendId = message.friendId || (userId === fromUserId ? toUserId : fromUserId);

        if (!friendId && (normalizedMessage.notificationType === "friend_request_received" || normalizedMessage.notificationType === "friend_request_accepted" || normalizedMessage.notificationType === "friend_request_rejected" || normalizedMessage.notificationType === "friend_removed")) {
          console.error("❌ friendId non déterminé:", message);
          return;
        }

        const friendData = {
          id: friendId || "",
          firstName: message.firstName || "",
          lastName: message.lastName || "",
          email: message.email || "",
          profilePictureUrl: message.profilePictureUrl || null,
        };

        switch (normalizedMessage.notificationType) {
          case "friend_request_received":
            if (userId === normalizedMessage.userId) {
              dispatch(addReceivedRequest(friendData));
              console.log("✅ Demande reçue ajoutée:", friendData);
            }
            break;

          case "friend_request_sent":
            if (userId === fromUserId) {
              dispatch(addSentRequest(friendData));
              console.log("✅ Demande envoyée ajoutée:", friendData);
            }
            break;

          case "friend_request_accepted":
            console.log("🔍 Traitement de friend_request_accepted - userId:", userId, "fromUserId:", fromUserId, "toUserId:", toUserId);
            dispatch(addFriend(friendData));
            if (userId === normalizedMessage.userId && fromUserId !== userId) {
              dispatch(removeReceivedRequest(friendId));
              console.log("✅ Demande acceptée (destinataire), supprimée de receivedRequests:", friendId, "État actuel:", receivedRequests);
            } else if (userId === fromUserId) {
              dispatch(removeSentRequest(friendId));
              console.log("✅ Demande acceptée (expéditeur), supprimée de sentRequests:", friendId, "État actuel:", sentRequests);
            }
            console.log("✅ Ami ajouté:", friendData, "État friends:", friends);
            break;

          case "friend_request_rejected":
            console.log("🔍 Traitement de friend_request_rejected - userId:", userId, "friendId:", friendId, "fromUserId:", fromUserId, "toUserId:", toUserId);
            if (userId === friendId) {
              dispatch(removeReceivedRequest(fromUserId));
              console.log("✅ Demande rejetée (destinataire), supprimée de receivedRequests:", fromUserId, "État actuel:", receivedRequests);
            } else if (userId !== friendId && userId !== fromUserId) {
              dispatch(removeSentRequest(friendId));
              console.log("✅ Demande rejetée (expéditeur), supprimée de sentRequests:", friendId, "État actuel:", sentRequests);
            }
            console.log("✅ État après rejet - friendId:", friendId, "sentRequests:", sentRequests, "receivedRequests:", receivedRequests);
            break;

          case "friend_removed":
            console.log("🔍 Traitement de friend_removed - userId:", userId, "friendId:", friendId, "fromUserId:", fromUserId, "toUserId:", toUserId);
            dispatch(removeFriendFromList(friendId));
            dispatch(removeSentRequest(friendId));
            dispatch(removeReceivedRequest(friendId));
            console.log("✅ État nettoyé après friend_removed - friendId:", friendId, "sentRequests:", sentRequests, "receivedRequests:", receivedRequests, "friends:", friends);
            break;

          case "friend_request_canceled":
            if (userId === fromUserId) {
              dispatch(removeSentRequest(friendId));
              console.log("✅ Demande annulée, supprimée de sentRequests:", friendId);
            } else if (userId === toUserId) {
              dispatch(removeReceivedRequest(friendId));
              console.log("✅ Demande annulée, supprimée de receivedRequests:", friendId);
            }
            break;

          case "user_like":
            console.log("🔍 Traitement de user_like - userId:", userId, "fromUserId:", fromUserId);
            if (userId === normalizedMessage.userId) {
              dispatch(addNotification({
                id: normalizedMessage.id,
                userId: normalizedMessage.userId,
                type: "user_like",
                message: message.message || "Quelqu'un a aimé votre profil !",
                timestamp: normalizedTimestamp,
                isRead: false,
                data: normalizedMessage.data,
              }));
              console.log("✅ Notification user_like ajoutée:", normalizedMessage);
            }
            break;

          case "user_unlike":
            console.log("🔍 Traitement de user_unlike - userId:", userId, "fromUserId:", fromUserId);
            if (userId === normalizedMessage.userId) {
              dispatch(addNotification({
                id: normalizedMessage.id,
                userId: normalizedMessage.userId,
                type: "user_unlike",
                message: message.message || "Quelqu'un a retiré son like de votre profil !",
                timestamp: normalizedTimestamp,
                isRead: false,
                data: normalizedMessage.data,
              }));
              console.log("✅ Notification user_unlike ajoutée:", normalizedMessage);
            }
            break;

          case "connected":
            console.log("✅ Connexion WebSocket confirmée pour userId:", userId);
            break;

          default:
            console.warn("⚠️ Notification non gérée:", normalizedMessage.notificationType);
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

            const isNewChat = message.type === "private" && !messages.some((msg) => msg.chatId === normalizedMessage.chatId && msg.fromUserId !== userId);
            if (isNewChat) {
              dispatch(addNotification({
                id: `new-chat-${normalizedMessage.id}`,
                userId: userId || "",
                type: "new_chat",
                message: `Nouveau chat avec ${message.fromUserId}`,
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