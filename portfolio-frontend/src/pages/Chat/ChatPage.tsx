// portfolio-frontend/src/pages/Chat/ChatPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../redux/store";
import {
  fetchAllConversations,
  fetchPrivateMessages,
  fetchGroupMessages,
  addMessage,
  updateMessage,
} from "../../redux/features/chatSlice";
import { fetchUser, fetchUserById } from "../../redux/features/userSlice";
import { getAllImagesByUserId } from "../../redux/features/imageSlice";
import ChatMessages from "./ChatComponents/ChatMessages";
import MessageInput from "./ChatComponents/MessageInput";
import ContactInfo from "./ChatComponents/ContactInfo";
import ReportUser from "./ChatComponents/ReportUser";
import BlockUser from "./ChatComponents/BlockUser";
import SearchMessages from "./ChatComponents/SearchMessages";
import EphemeralMessages from "./ChatComponents/EphemeralMessages";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faFlag, faBan, faSearch, faClock } from "@fortawesome/free-solid-svg-icons";
import "./ChatPage.css";

interface Message {
  id: string;
  type: string;
  fromUserId: string;
  toUserId?: string;
  groupId?: string;
  chatId: string;
  content: string;
  timestamp: string;
}

interface ChatPageProps {
  wsInstance: WebSocket | null;
}

const ChatPage: React.FC<ChatPageProps> = ({ wsInstance }) => {
  const { type, id } = useParams<{ type?: "private" | "group"; id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { messages, groups, status } = useSelector((state: RootState) => state.chat);
  const { token, userId } = useSelector((state: RootState) => state.auth);
  const { members, user } = useSelector((state: RootState) => state.user);
  const { images } = useSelector((state: RootState) => state.image);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(id || null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEphemeral, setShowEphemeral] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);
  const messageOptionsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const messageIconRef = useRef<Map<string, HTMLElement>>(new Map());
  const connectWebSocket = () => {}; // Placeholder

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
    userIds.forEach((uid) => dispatch(getAllImagesByUserId(uid)));
  }, [messages, userId, dispatch]);

  useEffect(() => {
    if (!wsInstance) {
      console.log("🔴 WebSocket non disponible, tentative de connexion...");
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        console.log("📥 Message reçu via WebSocket:", receivedMessage);

        if (receivedMessage.chatId && receivedMessage.id) {
          const tempMessage = messages.find(
            (msg) => msg.chatId === receivedMessage.chatId && msg.fromUserId === userId && msg.content === receivedMessage.content
          );
          if (tempMessage && tempMessage.id.startsWith("temp-")) {
            console.log("🔄 Remplacement du message temporaire:", tempMessage.id, "par:", receivedMessage.id);
            dispatch(updateMessage({ tempId: tempMessage.id, updatedMessage: receivedMessage }));
            // Mettre à jour selectedChatId si nécessaire
            if (selectedChatId && selectedChatId.startsWith("temp-")) {
              setSelectedChatId(receivedMessage.chatId);
            }
          } else {
            console.log("📩 Ajout d'un nouveau message reçu:", receivedMessage);
            dispatch(addMessage(receivedMessage));
          }
        } else {
          console.log("Notification ignorée:", receivedMessage);
        }
      } catch (error) {
        console.error("Erreur lors de la réception du message WebSocket:", error);
      }
    };

    wsInstance.addEventListener("message", handleMessage);

    return () => {
      wsInstance.removeEventListener("message", handleMessage);
    };
  }, [wsInstance, dispatch, selectedChatId, id, messages, userId]);

  useEffect(() => {
    if (!wsInstance) {
      console.log("🔴 WebSocket non disponible, tentative de connexion...");
      return;
    }

    const handleClose = () => {
      console.log("🔴 WebSocket fermé, tentative de reconnexion...");
      connectWebSocket();
    };

    const handleError = (error: Event) => {
      console.error("❌ Erreur WebSocket:", error);
    };

    wsInstance.addEventListener("close", handleClose);
    wsInstance.addEventListener("error", handleError);

    return () => {
      wsInstance.removeEventListener("close", handleClose);
      wsInstance.removeEventListener("error", handleError);
    };
  }, [wsInstance, connectWebSocket]);

  const getOtherUserIdFromChat = () => {
    if (!selectedChatId || groups.includes(selectedChatId)) return null;
    const chat = messages.find((msg) => msg.chatId === selectedChatId);
    return chat ? (chat.toUserId === userId ? chat.fromUserId : chat.toUserId) : (type === "private" && id ? id : null);
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
    const chatMap = new Map<string, { chatId: string; isGroup: boolean; otherUserId?: string; latestTimestamp: string }>();
    messages.forEach((msg) => {
      if (msg.chatId) {
        if (msg.type === "private" || msg.type === "group_message") {
          const otherUserId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
          if (otherUserId) {
            const existingChat = chatMap.get(otherUserId);
            const currentTimestamp = new Date(msg.timestamp).getTime();
            if (!existingChat || new Date(existingChat.latestTimestamp).getTime() < currentTimestamp) {
              chatMap.set(otherUserId, {
                chatId: msg.chatId,
                isGroup: msg.type === "group_message",
                otherUserId,
                latestTimestamp: msg.timestamp,
              });
            }
          }
        }
      }
    });
    // Trier par timestamp décroissant (les plus récents en premier)
    const sortedChats = Array.from(chatMap.values()).sort((a, b) => {
      return new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime();
    });
    console.log("🔍 Chats uniques générés et triés par date:", sortedChats); // Log pour débogage
    return sortedChats;
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

  const toggleActions = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowActions(showActions === messageId ? null : messageId);
  };

  const otherUserId = getOtherUserIdFromChat() || "";

  return (
    <div className="chat-page-container">
      <div className="chat-page-chat-container">
        <div className="chat-page-sidebar">
          <h3 className="chat-page-sidebar-title">Conversations</h3>
          <button className="chat-page-sidebar-refresh" onClick={refreshData}>Rafraîchir</button>
          <ul className="chat-page-sidebar-list">
            {getUniqueChats().map((chat) => (
              <li
                key={chat.chatId}
                className={`chat-page-sidebar-item ${chat.chatId === selectedChatId ? "active" : ""}`}
                onClick={() => handleChatSelect(chat.chatId, chat.isGroup)}
              >
                <div className="chat-page-chat-item">
                  {chat.isGroup ? (
                    <div className="chat-page-avatar-placeholder">
                      <i className="fas fa-users"></i>
                    </div>
                  ) : (
                    <div className="chat-page-avatar">
                      {getProfileImage(chat.otherUserId || chat.chatId) ? (
                        <img
                          src={`http://localhost:7000/${getProfileImage(chat.otherUserId || chat.chatId)}`}
                          alt="Profile"
                          className="chat-page-avatar-img"
                        />
                      ) : (
                        <div className="chat-page-avatar-placeholder">
                          <i className="fas fa-user-circle"></i>
                        </div>
                      )}
                    </div>
                  )}
                  <span className="chat-page-chat-name">
                    {chat.isGroup ? `Groupe ${chat.chatId}` : getContactName(chat.otherUserId || chat.chatId)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-page-main">
          <div className="chat-page-header">
            <h3 className="chat-page-header-title">
              {selectedChatId
                ? groups.includes(selectedChatId)
                  ? `Groupe ${selectedChatId}`
                  : getContactName(getOtherUserIdFromChat() || selectedChatId)
                : "Sélectionnez une conversation"}
            </h3>
            {selectedChatId && !groups.includes(selectedChatId) && (
              <div className="chat-page-header-actions">
                <FontAwesomeIcon
                  icon={faUser}
                  className="chat-page-header-icon"
                  onClick={() => setShowContactInfo(true)}
                  title="Afficher le contact"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="chat-page-header-icon"
                  onClick={() => setShowSearch(true)}
                  title="Rechercher dans les messages"
                />
                <FontAwesomeIcon
                  icon={faClock}
                  className="chat-page-header-icon"
                  onClick={() => setShowEphemeral(true)}
                  title="Messages éphémères"
                />
                <FontAwesomeIcon
                  icon={faFlag}
                  className="chat-page-header-icon"
                  onClick={() => setShowReport(true)}
                  title="Signaler"
                />
                <FontAwesomeIcon
                  icon={faBan}
                  className="chat-page-header-icon"
                  onClick={() => setShowBlock(true)}
                  title="Bloquer"
                />
              </div>
            )}
          </div>
          <ChatMessages
            selectedChatId={selectedChatId}
            userId={userId}
            showActions={showActions}
            setShowActions={setShowActions}
            messageOptionsRef={messageOptionsRef}
            messageIconRef={messageIconRef}
          />
          <MessageInput
            selectedChatId={selectedChatId}
            setSelectedChatId={setSelectedChatId}
            wsInstance={wsInstance}
            userId={userId}
            type={type}
            id={id}
            groups={groups}
          />
          <ContactInfo
            userId={otherUserId}
            isOpen={showContactInfo}
            onClose={() => setShowContactInfo(false)}
            selectedChatId={selectedChatId}
          />
          <ReportUser userId={otherUserId} messageId="" isOpen={showReport} onClose={() => setShowReport(false)} />
          <BlockUser userId={otherUserId} isOpen={showBlock} onClose={() => setShowBlock(false)} />
          <SearchMessages chatId={selectedChatId || ""} isOpen={showSearch} onClose={() => setShowSearch(false)} />
          <EphemeralMessages chatId={selectedChatId || ""} isOpen={showEphemeral} onClose={() => setShowEphemeral(false)} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;