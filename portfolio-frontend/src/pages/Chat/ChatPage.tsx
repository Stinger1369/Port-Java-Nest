import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../redux/store";
import {
  fetchAllConversations,
  fetchPrivateMessages,
  fetchGroupMessages,
  updateMessage,
  deleteMessage,
  addMessage,
  addGroup,
  resetMessages,
} from "../../redux/features/chatSlice";
import { fetchAllUsers, fetchUser } from "../../redux/features/userSlice";
import { BASE_URL } from "../../config/hostname";
import "./ChatPage.css";

const ChatPage: React.FC = () => {
  const { type, id } = useParams<{ type?: "private" | "group"; id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { messages, groups, status } = useSelector((state: RootState) => state.chat);
  const { token, userId } = useSelector((state: RootState) => state.auth);
  const { members, user } = useSelector((state: RootState) => state.user);
  const [messageInput, setMessageInput] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(id || null);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageOptionsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const messageIconRef = useRef<Map<string, HTMLElement>>(new Map());

  // Fonction pour normaliser les timestamps (synchronisée avec chatSlice.ts)
  const normalizeTimestamp = (timestamp: any): string => {
    // Vérifie si timestamp est une chaîne ISO valide (contenant "Z")
    if (typeof timestamp === "string" && timestamp.includes("Z")) {
      return timestamp; // Format ISO, déjà correct
    }
    // Fallback à la date actuelle si le timestamp est invalide
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

      // Normalisation du timestamp
      const normalizedTimestamp = normalizeTimestamp(message.timestamp);

      const normalizedMessage = {
        ...message,
        timestamp: normalizedTimestamp,
      };

      if (message.type === "private" || message.type === "group_message") {
        if (!messages.some(msg => msg.id === normalizedMessage.id)) {
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
          timestamp: normalizedTimestamp,
        };
        console.log("📤 Ajout d’un message privé local (destinataire hors ligne):", localMessage);
        if (!messages.some(msg => msg.id === localMessage.id)) {
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

  const refreshData = () => {
    if (!token) return;
    console.log("🔍 Rafraîchissement des conversations et utilisateurs...");
    dispatch(resetMessages());
    dispatch(fetchAllConversations()).then((result) => {
      console.log("🔍 Conversations après rafraîchissement:", result.payload);
    });
    dispatch(fetchAllUsers()).then((result) => {
      console.log("🔍 Membres actuels après rafraîchissement:", result.payload.map(m => ({ id: m.id, firstName: m.firstName, lastName: m.lastName })));
    });
    dispatch(fetchUser()).then((result) => {
      console.log("🔍 Utilisateur connecté après rafraîchissement:", result.payload);
    });
  };

  useEffect(() => {
    if (!token) return;

    connectWebSocket();
    refreshData();

    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsideMenu = false;
      let clickedOnIcon = false;

      messageOptionsRef.current.forEach((ref, messageId) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInsideMenu = true;
        }
      });

      messageIconRef.current.forEach((ref, messageId) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedOnIcon = true;
        }
      });

      if (!clickedInsideMenu && !clickedOnIcon) {
        setShowActions(null);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      document.removeEventListener("click", handleClickOutside);
    };
  }, [token, dispatch]);

  const isRecipientDeleted = () => {
    if (!selectedChatId || groups.includes(selectedChatId)) return false;
    const otherUserId = messages.find(msg => msg.chatId === selectedChatId)?.toUserId === userId
      ? messages.find(msg => msg.chatId === selectedChatId)?.fromUserId
      : messages.find(msg => msg.chatId === selectedChatId)?.toUserId;
    if (!otherUserId) {
      console.log("🔍 Aucun otherUserId trouvé pour selectedChatId:", selectedChatId);
      return false;
    }
    const member = members.find((m) => m.id === otherUserId);
    console.log(`🔍 Vérification si ${otherUserId} est supprimé. Trouvé dans members:`, !!member);
    return !member;
  };

  const getOtherUserIdFromChat = () => {
    if (!selectedChatId || groups.includes(selectedChatId)) return null;
    const chat = messages.find(msg => msg.chatId === selectedChatId);
    return chat ? (chat.toUserId === userId ? chat.fromUserId : chat.toUserId) : null;
  };

  const sendMessage = () => {
    console.log("🔍 Tentative d’envoi de message...");
    console.log("🔍 Utilisateur actuel:", userId);
    console.log("🔍 Instance WebSocket:", wsInstance);
    console.log("🔍 État WebSocket:", wsInstance?.readyState);
    console.log("🔍 Contenu du message:", messageInput);
    console.log("🔍 ChatId sélectionné:", selectedChatId);
    console.log("🔍 État actuel de members:", members.map(m => ({ id: m.id, firstName: m.firstName, lastName: m.lastName })));

    if (isRecipientDeleted()) {
      console.log("❌ Envoi impossible: le destinataire a supprimé son compte");
      return;
    }

    const toUserId = getOtherUserIdFromChat();
    if (!toUserId) {
      console.log("❌ Aucun destinataire valide trouvé pour cette conversation");
      return;
    }

    if (wsInstance && wsInstance.readyState === WebSocket.OPEN && messageInput && selectedChatId) {
      const isGroup = groups.includes(selectedChatId);
      const message = {
        type: isGroup ? "group_message" : "private",
        [isGroup ? "groupId" : "toUserId"]: toUserId,
        content: messageInput,
      };
      console.log("📤 Envoi du message au WebSocket:", message);
      wsInstance.send(JSON.stringify(message));
      setMessageInput("");
      console.log("✅ Message envoyé au WebSocket, en attente de réponse du serveur");
    } else {
      console.error("❌ Impossible d’envoyer le message: WebSocket non connecté ou chat non sélectionné");
      if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
        console.log("🔄 WebSocket non connecté, tentative de reconnexion...");
        connectWebSocket();
      }
    }
  };

  const handleUpdateMessage = (messageId: string, currentContent: string) => {
    const newContent = prompt("Modifier le message :", currentContent);
    if (newContent) {
      dispatch(updateMessage({ id: messageId, content: newContent }));
      setShowActions(null);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm("Supprimer ce message ?")) {
      dispatch(deleteMessage(messageId));
      setShowActions(null);
    }
  };

  const handleChatSelect = (chatId: string, isGroup: boolean) => {
    console.log("🔍 Chat sélectionné:", chatId, "isGroup:", isGroup);
    setSelectedChatId(chatId);
    if (isGroup) {
      dispatch(fetchGroupMessages(chatId));
      navigate(`/chat/group/${chatId}`);
    } else {
      const otherUserId = messages.find(msg => msg.chatId === chatId)?.toUserId === userId
        ? messages.find(msg => msg.chatId === chatId)?.fromUserId
        : messages.find(msg => msg.chatId === chatId)?.toUserId;
      dispatch(fetchPrivateMessages(otherUserId || chatId));
      navigate(`/chat/private/${otherUserId || chatId}`);
    }
  };

  const getContactName = (contactId: string) => {
    if (!contactId || contactId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      console.log(`🔍 ${contactId} semble être un chatId, pas un userId`);
      return "Conversation inconnue";
    }
    const member = members.find((m) => m.id === contactId);
    console.log(`🔍 Recherche de ${contactId} dans members:`, members.map(m => ({ id: m.id, firstName: m.firstName, lastName: m.lastName })), "Trouvé:", !!member);
    if (!member) {
      console.log(`🔍 Utilisateur ${contactId} non trouvé dans members, probablement supprimé`);
      return "Account deleted";
    }
    const name = `${member.firstName || ""} ${member.lastName || ""}`.trim();
    return name || contactId;
  };

  const toggleActions = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowActions(showActions === messageId ? null : messageId);
  };

  const getUniqueChats = () => {
    const chatMap = new Map<string, { chatId: string; isGroup: boolean; otherUserId?: string }>();
    messages.forEach(msg => {
      if (msg.chatId) {
        if (msg.type === "private") {
          const otherUserId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
          chatMap.set(msg.chatId, { chatId: msg.chatId, isGroup: false, otherUserId });
        } else if (msg.type === "group_message") {
          chatMap.set(msg.chatId, { chatId: msg.chatId, isGroup: true });
        }
      }
    });
    return Array.from(chatMap.values());
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-sidebar">
          <h3>Conversations</h3>
          <button onClick={refreshData}>Rafraîchir</button>
          <ul>
            {getUniqueChats().map(chat => (
              <li
                key={chat.chatId}
                className={chat.chatId === selectedChatId ? "active" : ""}
                onClick={() => handleChatSelect(chat.chatId, chat.isGroup)}
              >
                {chat.isGroup ? `Groupe ${chat.chatId}` : getContactName(chat.otherUserId || chat.chatId)}
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-main">
          <div className="chat-header">
            <h3>
              {selectedChatId
                ? (groups.includes(selectedChatId) ? `Groupe ${selectedChatId}` : getContactName(messages.find(msg => msg.chatId === selectedChatId)?.toUserId === userId ? messages.find(msg => msg.chatId === selectedChatId)?.fromUserId : messages.find(msg => msg.chatId === selectedChatId)?.toUserId || selectedChatId))
                : "Sélectionnez une conversation"}
            </h3>
          </div>
          <div className="chat-messages">
            {status === "loading" && <p>Loading...</p>}
            {console.log("🔍 Messages actuels dans le rendu:", messages)}
            {messages
              .filter((msg) => msg.chatId === selectedChatId)
              .map((msg) => (
                <div key={msg.id} className={`message ${msg.fromUserId === userId ? "sent" : "received"}`}>
                  <div className="message-content">
                    <p>
                      <strong>{getContactName(msg.fromUserId)}</strong> {msg.content}
                    </p>
                    <div className="message-meta">
                      <span>{new Date(msg.timestamp).toLocaleString()}</span>
                      {msg.fromUserId === userId && (
                        <i
                          className="fas fa-caret-down message-options"
                          onClick={(event) => toggleActions(msg.id, event)}
                          ref={(el) => {
                            if (el) {
                              messageIconRef.current.set(msg.id, el);
                            } else {
                              messageIconRef.current.delete(msg.id);
                            }
                          }}
                        ></i>
                      )}
                    </div>
                    {msg.fromUserId === userId && showActions === msg.id && (
                      <div
                        className="message-actions"
                        ref={(el) => {
                          if (el) {
                            messageOptionsRef.current.set(msg.id, el);
                          } else {
                            messageOptionsRef.current.delete(msg.id);
                          }
                        }}
                      >
                        <button onClick={() => handleUpdateMessage(msg.id, msg.content)}>
                          <i className="fas fa-edit"></i> Modifier
                        </button>
                        <button onClick={() => handleDeleteMessage(msg.id)}>
                          <i className="fas fa-trash"></i> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                !selectedChatId
                  ? "Sélectionnez une conversation pour écrire"
                  : isRecipientDeleted()
                  ? "Ce compte a été supprimé"
                  : "Tapez votre message ici..."
              }
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={!selectedChatId || isRecipientDeleted()}
            />
            <button onClick={sendMessage} disabled={!selectedChatId || isRecipientDeleted()}>
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;