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
import { fetchUser, fetchUserById } from "../../redux/features/userSlice";
import { getAllImagesByUserId } from "../../redux/features/imageSlice";
import { useWebSocket } from "../../pages/Chat/useWebSocket";
import "./ChatPage.css";

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

const ChatPage: React.FC = () => {
  const { type, id } = useParams<{ type?: "private" | "group"; id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { messages, groups, status } = useSelector((state: RootState) => state.chat);
  const { token, userId } = useSelector((state: RootState) => state.auth);
  const { members, user } = useSelector((state: RootState) => state.user); // Corrigé QRSState
  const { images } = useSelector((state: RootState) => state.image);
  const [messageInput, setMessageInput] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(id || null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const { wsInstance, connectWebSocket, sendMessage } = useWebSocket(token);
  const messageOptionsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const messageIconRef = useRef<Map<string, HTMLElement>>(new Map());

  const refreshData = () => {
    if (!token) return;
    console.log("🔍 Rafraîchissement des conversations et utilisateur connecté...");
    dispatch(fetchAllConversations()).then((result) => {
      console.log("🔍 Conversations après rafraîchissement:", result.payload);
      if (result.payload && result.payload.length > 0) {
        const userIds = new Set<string>();
        result.payload.forEach((msg: Message) => {
          userIds.add(msg.fromUserId);
          if (msg.toUserId) userIds.add(msg.toUserId);
        });
        userIds.delete(userId || "");
        userIds.forEach((uid) => dispatch(fetchUserById(uid)));
      }
    });
    dispatch(fetchUser()).then((result) => {
      console.log("🔍 Utilisateur connecté après rafraîchissement:", result.payload);
    });
  };

  useEffect(() => {
    if (!token) return;

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
      document.removeEventListener("click", handleClickOutside);
    };
  }, [token, dispatch, userId]);

  useEffect(() => {
    if (type && id) {
      if (type === "private") {
        dispatch(fetchPrivateMessages(id)).then((result) => {
          if (result.payload && result.payload.length > 0) {
            setSelectedChatId(result.payload[0].chatId);
            console.log("🔍 ChatId sélectionné pour privé:", result.payload[0].chatId);
            const otherUserId = result.payload[0].fromUserId === userId ? result.payload[0].toUserId : result.payload[0].fromUserId;
            if (otherUserId) dispatch(fetchUserById(otherUserId));
          } else {
            setSelectedChatId(`temp-${id}`);
            console.log("🔍 ChatId temporaire défini:", `temp-${id}`);
            dispatch(fetchUserById(id));
          }
        });
      } else if (type === "group") {
        dispatch(fetchGroupMessages(id));
        setSelectedChatId(id);
      }
    }
  }, [type, id, dispatch, userId]);

  useEffect(() => {
    const userIds = new Set<string>();
    messages.forEach((msg) => {
      userIds.add(msg.fromUserId);
      if (msg.toUserId) userIds.add(msg.toUserId);
    });
    userIds.delete(userId || "");
    userIds.forEach((uid) => {
      dispatch(getAllImagesByUserId(uid));
    });
  }, [messages, userId, dispatch]);

  const isRecipientDeleted = () => {
    if (!selectedChatId || groups.includes(selectedChatId)) return false;
    const otherUserId = messages.find((msg) => msg.chatId === selectedChatId)?.toUserId === userId
      ? messages.find((msg) => msg.chatId === selectedChatId)?.fromUserId
      : messages.find((msg) => msg.chatId === selectedChatId)?.toUserId;
    if (!otherUserId) return false;
    return !members.find((m) => m.id === otherUserId);
  };

  const getOtherUserIdFromChat = () => {
    if (!selectedChatId || groups.includes(selectedChatId)) return null;
    const chat = messages.find((msg) => msg.chatId === selectedChatId);
    return chat ? (chat.toUserId === userId ? chat.fromUserId : chat.toUserId) : type === "private" && id ? id : null;
  };

  const getExistingChatId = (toUserId: string) => {
    const existingMessage = messages.find(
      (msg) => (msg.fromUserId === userId && msg.toUserId === toUserId) || (msg.fromUserId === toUserId && msg.toUserId === userId)
    );
    return existingMessage ? existingMessage.chatId : `temp-${toUserId}`;
  };

  const sendMessageHandler = () => {
    if (isRecipientDeleted()) {
      console.log("❌ Envoi impossible: le destinataire a supprimé son compte");
      return;
    }

    let toUserId = getOtherUserIdFromChat();
    if (!toUserId && type === "private" && id) {
      toUserId = id;
    }

    if (!toUserId) {
      console.log("❌ Aucun destinataire valide trouvé pour cette conversation");
      return;
    }

    if (messageInput && selectedChatId) {
      const chatId = groups.includes(selectedChatId) ? selectedChatId : getExistingChatId(toUserId);
      const messageType = groups.includes(selectedChatId) ? "group_message" : "private";

      sendMessage(toUserId, messageInput, chatId, messageType);

      // Ajouter le message localement en attendant la réponse du serveur
      const localMessage = {
        id: `${userId}-${Date.now()}`, // ID temporaire
        type: messageType,
        fromUserId: userId!,
        toUserId: messageType === "private" ? toUserId : undefined,
        groupId: messageType === "group_message" ? selectedChatId : undefined,
        chatId,
        content: messageInput,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(localMessage));
      setMessageInput("");
    } else {
      console.error("❌ Impossible d'envoyer le message: entrée vide ou chat non sélectionné");
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
    setSelectedChatId(chatId);
    if (isGroup) {
      dispatch(fetchGroupMessages(chatId));
      navigate(`/chat/group/${chatId}`);
    } else {
      const otherUserId = messages.find((msg) => msg.chatId === chatId)?.toUserId === userId
        ? messages.find((msg) => msg.chatId === chatId)?.fromUserId
        : messages.find((msg) => msg.chatId === chatId)?.toUserId;
      const targetUserId = otherUserId || chatId;
      dispatch(fetchPrivateMessages(targetUserId)).then((result) => {
        if (result.payload && result.payload.length > 0) {
          setSelectedChatId(result.payload[0].chatId);
          console.log("🔍 ChatId mis à jour après sélection:", result.payload[0].chatId);
          const fetchedOtherUserId = result.payload[0].fromUserId === userId ? result.payload[0].toUserId : result.payload[0].fromUserId;
          if (fetchedOtherUserId) dispatch(fetchUserById(fetchedOtherUserId));
        } else {
          setSelectedChatId(chatId);
          console.log("🔍 Aucun message trouvé, conservation du chatId:", chatId);
          if (!otherUserId) dispatch(fetchUserById(targetUserId));
        }
      });
      navigate(`/chat/private/${targetUserId}`);
    }
  };

  const getContactName = (contactId: string) => {
    if (!contactId) return "Utilisateur inconnu";
    if (contactId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      const chatMessage = messages.find((msg) => msg.chatId === contactId);
      if (chatMessage) {
        const otherUserId = chatMessage.fromUserId === userId ? chatMessage.toUserId : chatMessage.fromUserId;
        if (otherUserId) contactId = otherUserId;
      } else if (type === "private" && id) {
        contactId = id;
      }
    }
    const member = members.find((m) => m.id === contactId);
    if (!member) {
      console.log("⚠️ Membre non trouvé pour contactId:", contactId);
      return contactId;
    }
    const name = `${member.firstName || ""} ${member.lastName || ""}`.trim();
    return name || contactId;
  };

  const getProfileImage = (contactId: string) => {
    if (!contactId) return null;
    if (contactId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      const chatMessage = messages.find((msg) => msg.chatId === contactId);
      if (chatMessage) {
        const otherUserId = chatMessage.fromUserId === userId ? chatMessage.toUserId : chatMessage.fromUserId;
        if (otherUserId) contactId = otherUserId;
      } else if (type === "private" && id) {
        contactId = id;
      }
    }
    const userImages = images.filter((img) => img.userId === contactId);
    if (userImages.length > 0) {
      const profileImg = userImages.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) || userImages[0];
      return profileImg.path;
    }
    return null;
  };

  const getUniqueChats = () => {
    const chatMap = new Map<string, { chatId: string; isGroup: boolean; otherUserId?: string }>();
    messages.forEach((msg) => {
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

  const toggleActions = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowActions(showActions === messageId ? null : messageId);
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-sidebar">
          <h3>Conversations</h3>
          <button onClick={refreshData}>Rafraîchir</button>
          <ul>
            {getUniqueChats().map((chat) => (
              <li
                key={chat.chatId}
                className={chat.chatId === selectedChatId ? "active" : ""}
                onClick={() => handleChatSelect(chat.chatId, chat.isGroup)}
              >
                <div className="chat-item">
                  {chat.isGroup ? (
                    <div className="chat-avatar-placeholder">
                      <i className="fas fa-users"></i>
                    </div>
                  ) : (
                    <div className="chat-avatar">
                      {getProfileImage(chat.otherUserId || chat.chatId) ? (
                        <img
                          src={`http://localhost:7000/${getProfileImage(chat.otherUserId || chat.chatId)}`}
                          alt="Profile"
                          className="chat-avatar-img"
                        />
                      ) : (
                        <div className="chat-avatar-placeholder">
                          <i className="fas fa-user-circle"></i>
                        </div>
                      )}
                    </div>
                  )}
                  <span className="chat-name">
                    {chat.isGroup ? `Groupe ${chat.chatId}` : getContactName(chat.otherUserId || chat.chatId)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-main">
          <div className="chat-header">
            <h3>
              {selectedChatId
                ? groups.includes(selectedChatId)
                  ? `Groupe ${selectedChatId}`
                  : getContactName(getOtherUserIdFromChat() || selectedChatId)
                : "Sélectionnez une conversation"}
            </h3>
          </div>
          <div className="chat-messages">
            {status === "loading" && <p>Loading...</p>}
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
                            if (el) messageIconRef.current.set(msg.id, el);
                            else messageIconRef.current.delete(msg.id);
                          }}
                        ></i>
                      )}
                    </div>
                    {msg.fromUserId === userId && showActions === msg.id && (
                      <div
                        className="message-actions"
                        ref={(el) => {
                          if (el) messageOptionsRef.current.set(msg.id, el);
                          else messageOptionsRef.current.delete(msg.id);
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
              onKeyPress={(e) => e.key === "Enter" && sendMessageHandler()}
              disabled={!selectedChatId || isRecipientDeleted()}
            />
            <button onClick={sendMessageHandler} disabled={!selectedChatId || isRecipientDeleted()}>
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;