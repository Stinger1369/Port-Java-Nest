// portfolio-frontend/src/pages/Chat/ChatPage.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../redux/store";
import {
  fetchAllConversations,
  fetchPrivateMessages,
  fetchGroupMessages,
  addMessage,
  updateMessage,
  setChatTheme,
} from "../../redux/features/chatSlice";
import { fetchUser, fetchUserById, saveChatTheme } from "../../redux/features/userSlice";
import { refreshToken } from "../../redux/features/authSlice"; // Importer refreshToken depuis authSlice
import { getAllImagesByUserId } from "../../redux/features/imageSlice";
import ChatMessages from "./ChatComponents/ChatMessages";
import MessageInput from "./ChatComponents/MessageInput";
import ContactInfo from "./ChatComponents/ContactInfo";
import ReportUser from "./ChatComponents/ReportUser";
import BlockUser from "./ChatComponents/BlockUser";
import SearchMessages from "./ChatComponents/SearchMessages";
import EphemeralMessages from "./ChatComponents/EphemeralMessages";
import ChatTheme from "./ChatComponents/ChatTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faFlag,
  faBan,
  faSearch,
  faClock,
  faPaintBrush,
} from "@fortawesome/free-solid-svg-icons";
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
  connectWebSocket: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ wsInstance, connectWebSocket }) => {
  const { type, id } = useParams<{ type?: "private" | "group"; id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { messages, groups, status, theme } = useSelector((state: RootState) => state.chat);
  const { token, userId } = useSelector((state: RootState) => state.auth);
  const { user, members } = useSelector((state: RootState) => state.user);
  const { images } = useSelector((state: RootState) => state.image);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(id || null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEphemeral, setShowEphemeral] = useState(false);
  const [showChatTheme, setShowChatTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    if (!token) return;
    console.log("🔍 Rafraîchissement des conversations et utilisateur connecté...");
    dispatch(fetchAllConversations()).then((result) => {
      console.log("🔍 Conversations après rafraîchissement:", result.payload);
      if (result.payload && Array.isArray(result.payload) && result.payload.length > 0) {
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
    if (!token) {
      setIsLoading(false);
      navigate("/login");
      return;
    }

    const checkAndRefreshToken = async () => {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const exp = decodedToken.exp * 1000;
        const now = Date.now();
        if (now >= exp - 300000) { // Rafraîchir 5 min avant expiration
          await dispatch(refreshToken()).unwrap();
          console.log("🔄 Token d'accès rafraîchi avant expiration");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du token:", error);
        navigate("/login");
      }
    };

const initializeTheme = async () => {
  try {
    await checkAndRefreshToken();
    console.log("🔍 Début de l'initialisation du thème...");
    const result = await dispatch(fetchUser()).unwrap();
    console.log("🔍 Résultat brut de fetchUser:", result);
    const initialTheme = ["light", "dark"].includes(result?.chatTheme) ? result.chatTheme : "light";
    console.log(`✅ Thème récupéré depuis fetchUser: ${initialTheme}`);
    document.documentElement.setAttribute("data-theme", initialTheme);
    dispatch(setChatTheme(initialTheme)); // Met à jour chatSlice.theme
    console.log(`🔹 Thème appliqué dans chatSlice et DOM: ${initialTheme}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation du thème:", error);
    document.documentElement.setAttribute("data-theme", "light");
    dispatch(setChatTheme("light"));
  } finally {
    console.log("🔍 Fin de l'initialisation du thème, isLoading passe à false");
    setIsLoading(false);
  }
};
    initializeTheme();
    refreshData();
  }, [token, dispatch, userId, navigate]);

useEffect(() => {
  console.log(`🔍 Thème actuel dans chatSlice après rendu: ${theme}`);
  console.log(`🔍 Thème dans state.user: ${user?.chatTheme}`);
  document.documentElement.setAttribute("data-theme", theme);
}, [theme, user?.chatTheme]);

  useEffect(() => {
    if (type && id) {
      if (type === "private") {
        dispatch(fetchPrivateMessages(id)).then((result) => {
          if (result.payload && Array.isArray(result.payload) && result.payload.length > 0) {
            setSelectedChatId(result.payload[0].chatId);
            console.log("🔍 ChatId sélectionné pour privé:", result.payload[0].chatId);
            const otherUserId =
              result.payload[0].fromUserId === userId
                ? result.payload[0].toUserId
                : result.payload[0].fromUserId;
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
      connectWebSocket();
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        console.log("📥 Message reçu via WebSocket:", receivedMessage);

        if (!receivedMessage || !receivedMessage.chatId || !receivedMessage.id) {
          console.warn("⚠️ Message WebSocket invalide, ignoré:", receivedMessage);
          return;
        }

        const tempMessage = messages.find(
          (msg) =>
            msg.chatId === receivedMessage.chatId &&
            msg.fromUserId === userId &&
            msg.content === receivedMessage.content
        );

        if (tempMessage && tempMessage.id.startsWith("temp-")) {
          console.log(
            "🔄 Remplacement du message temporaire:",
            tempMessage.id,
            "par:",
            receivedMessage.id
          );
          dispatch(
            updateMessage({
              tempId: tempMessage.id,
              updatedMessage: {
                ...receivedMessage,
                type: receivedMessage.type || "private",
              },
            })
          );
          if (selectedChatId && selectedChatId.startsWith("temp-")) {
            setSelectedChatId(receivedMessage.chatId);
          }
        } else {
          console.log("📩 Ajout d'un nouveau message reçu:", receivedMessage);
          dispatch(
            addMessage({
              ...receivedMessage,
              type: receivedMessage.type || "private",
            })
          );
        }
      } catch (error) {
        console.error("❌ Erreur lors de la réception du message WebSocket:", error);
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
      connectWebSocket();
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
    return chat
      ? chat.toUserId === userId
        ? chat.fromUserId
        : chat.toUserId
      : type === "private" && id
      ? id
      : null;
  };

  const getContactName = (contactId: string) => {
    if (!contactId) return "Utilisateur inconnu";
    if (
      contactId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
    ) {
      const chatMessage = messages.find((msg) => msg.chatId === contactId);
      if (chatMessage) {
        const otherUserId =
          chatMessage.fromUserId === userId ? chatMessage.toUserId : chatMessage.fromUserId;
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
    if (
      contactId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
    ) {
      const chatMessage = messages.find((msg) => msg.chatId === contactId);
      if (chatMessage) {
        const otherUserId =
          chatMessage.fromUserId === userId ? chatMessage.toUserId : chatMessage.fromUserId;
        if (otherUserId) contactId = otherUserId;
      } else if (type === "private" && id) {
        contactId = id;
      }
    }
    const userImages = images.filter((img) => img.userId === contactId);
    if (userImages.length > 0) {
      const profileImg =
        userImages.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) || userImages[0];
      return profileImg.path;
    }
    return null;
  };

  const getUniqueChats = () => {
    const chatMap = new Map<
      string,
      { chatId: string; isGroup: boolean; otherUserId?: string; latestTimestamp: string }
    >();
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
    const sortedChats = Array.from(chatMap.values()).sort((a, b) => {
      return new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime();
    });
    console.log("🔍 Chats uniques générés et triés par date:", sortedChats);
    return sortedChats;
  };

  const handleChatSelect = (chatId: string, isGroup: boolean) => {
    setSelectedChatId(chatId);
    if (isGroup) {
      dispatch(fetchGroupMessages(chatId));
      navigate(`/chat/group/${chatId}`);
    } else {
      const otherUserId =
        messages.find((msg) => msg.chatId === chatId)?.toUserId === userId
          ? messages.find((msg) => msg.chatId === chatId)?.fromUserId
          : messages.find((msg) => msg.chatId === chatId)?.toUserId;
      const targetUserId = otherUserId || chatId;
      dispatch(fetchPrivateMessages(targetUserId)).then((result) => {
        if (result.payload && Array.isArray(result.payload) && result.payload.length > 0) {
          setSelectedChatId(result.payload[0].chatId);
          console.log("🔍 ChatId mis à jour après sélection:", result.payload[0].chatId);
          const fetchedOtherUserId =
            result.payload[0].fromUserId === userId
              ? result.payload[0].toUserId
              : result.payload[0].fromUserId;
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

  const otherUserId = getOtherUserIdFromChat() || "";

  const applyTheme = (selectedTheme: string) => {
  const validTheme = ["light", "dark"].includes(selectedTheme) ? selectedTheme : "light";
  console.log(`🎨 Thème appliqué : ${validTheme}`);
  document.documentElement.setAttribute("data-theme", validTheme);
  dispatch(saveChatTheme(validTheme)).then((result) => {
    if (result.meta.requestStatus === "fulfilled") {
      const newTheme = result.payload; // chatTheme renvoyé par fetchUser
      dispatch(setChatTheme(newTheme));
      console.log(`🔍 Thème synchronisé après saveChatTheme: ${newTheme}`);
    }
  });
};

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <div className="chat-page-container">
        <div className="chat-page-chat-container">
          <div className="chat-page-sidebar">
            <h3 className="chat-page-sidebar-title">Conversations</h3>
            <button className="chat-page-sidebar-refresh" onClick={refreshData}>
              Rafraîchir
            </button>
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
                      {chat.isGroup
                        ? `Groupe ${chat.chatId}`
                        : getContactName(chat.otherUserId || chat.chatId)}
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
                  <FontAwesomeIcon
                    icon={faPaintBrush}
                    className="chat-page-header-icon"
                    onClick={() => setShowChatTheme(true)}
                    title="Thème du chat"
                  />
                </div>
              )}
            </div>
            <ChatMessages selectedChatId={selectedChatId} userId={userId} />
            <MessageInput
              selectedChatId={selectedChatId}
              setSelectedChatId={setSelectedChatId}
              wsInstance={wsInstance}
              userId={userId}
              type={type}
              id={id}
              groups={groups}
            />
          </div>
        </div>
      </div>

      <ContactInfo
        userId={otherUserId}
        isOpen={showContactInfo}
        onClose={() => setShowContactInfo(false)}
        selectedChatId={selectedChatId}
      />
      <ReportUser userId={otherUserId} messageId="" isOpen={showReport} onClose={() => setShowReport(false)} />
      <BlockUser userId={otherUserId} isOpen={showBlock} onClose={() => setShowBlock(false)} />
      <SearchMessages chatId={selectedChatId || ""} isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <EphemeralMessages
        chatId={selectedChatId || ""}
        isOpen={showEphemeral}
        onClose={() => setShowEphemeral(false)}
      />
      <ChatTheme
        chatId={selectedChatId || ""}
        isOpen={showChatTheme}
        onClose={() => setShowChatTheme(false)}
        onApply={(selectedTheme) => applyTheme(selectedTheme)}
        getContactName={getContactName}
      />
    </>
  );
};

export default ChatPage;