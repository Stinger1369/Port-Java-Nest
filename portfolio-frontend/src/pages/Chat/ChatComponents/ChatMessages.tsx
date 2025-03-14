// portfolio-frontend/src/pages/Chat/ChatComponents/ChatMessages.tsx
import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { updateMessage, deleteMessage } from "../../../redux/features/chatSlice";
import ContactInfo from "./ContactInfo";
import AddToList from "./AddToList";
import ReportUser from "./ReportUser";
import BlockUser from "./BlockUser";
import ChatTheme from "./ChatTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faUser, faList, faFlag, faBan, faPaintBrush, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./ChatMessages.css";

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

interface ChatMessagesProps {
  selectedChatId: string | null;
  userId: string | null;
  showActions: string | null;
  setShowActions: (id: string | null) => void;
  messageOptionsRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
  messageIconRef: React.MutableRefObject<Map<string, HTMLElement>>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  selectedChatId,
  userId,
  showActions,
  setShowActions,
  messageOptionsRef,
  messageIconRef,
}) => {
  const dispatch = useDispatch();
  const { messages, status } = useSelector((state: RootState) => state.chat);
  const { members } = useSelector((state: RootState) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonction pour défiler vers le dernier message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      console.log("⏬ Défilement vers le bas effectué");
    }
  };

  // Défilement automatique lorsque les messages changent
  useEffect(() => {
    console.log("📜 Liste des messages mise à jour dans ChatMessages:", messages);
    scrollToBottom();
  }, [messages]);

  const getContactName = (contactId: string) => {
    if (!contactId) return "Utilisateur inconnu";
    const member = members.find((m) => m.id === contactId);
    if (!member) {
      console.log("⚠️ Membre non trouvé pour contactId:", contactId);
      return contactId;
    }
    const name = `${member.firstName || ""} ${member.lastName || ""}`.trim();
    return name || contactId;
  };

  // Gestion des actions directes sur les icônes
  const handleAction = (action: string, msg: Message) => {
    switch (action) {
      case "update":
        const newContent = prompt("Nouveau contenu :", msg.content);
        if (newContent && newContent.trim() !== msg.content) {
          dispatch(updateMessage({ id: msg.id, content: newContent }))
            .unwrap()
            .then(() => console.log("✅ Message mis à jour avec succès"))
            .catch((error) => console.error("❌ Erreur lors de la mise à jour:", error));
        }
        break;
      case "delete":
        if (confirm("Voulez-vous vraiment supprimer ce message ?")) {
          dispatch(deleteMessage(msg.id))
            .unwrap()
            .then(() => console.log("✅ Message supprimé avec succès"))
            .catch((error) => console.error("❌ Erreur lors de la suppression:", error));
        }
        break;
      case "contact":
        setShowActions(msg.id); // Ouvre ContactInfo
        break;
      case "addToList":
        setShowActions(msg.id); // Ouvre AddToList
        break;
      case "report":
        setShowActions(msg.id); // Ouvre ReportUser
        break;
      case "block":
        setShowActions(msg.id); // Ouvre BlockUser
        break;
      case "theme":
        setShowActions(msg.id); // Ouvre ChatTheme
        break;
      default:
        break;
    }
    if (["contact", "addToList", "report", "block", "theme"].includes(action)) {
      setShowActions(null); // Ferme après avoir affiché les composants
    }
  };

  const toggleActions = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowActions(showActions === messageId ? null : messageId);
  };

  // Filtre ajusté pour inclure les messages temporaires et officiels
  const filteredMessages = selectedChatId
    ? messages.filter((msg) => {
        if (msg.chatId === selectedChatId) return true;
        if (selectedChatId.startsWith("temp-")) {
          const tempUserId = selectedChatId.replace("temp-", "");
          return (msg.toUserId === userId && msg.fromUserId === tempUserId) || (msg.fromUserId === userId && msg.toUserId === tempUserId);
        }
        const tempChatId = `temp-${msg.fromUserId === userId ? msg.toUserId : msg.fromUserId}`;
        return selectedChatId === tempChatId && (msg.fromUserId === userId || msg.toUserId === userId);
      })
    : [];

  // Calcul de l'otherUserId pour chaque message
  const getOtherUserId = (msg: Message) => {
    return msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
  };

  // Définir les icônes à afficher pour chaque message
  const getIcons = (msg: Message) => {
    const icons = [
      { icon: faUser, action: "contact", forAll: true },
      { icon: faList, action: "addToList", forAll: true },
      { icon: faFlag, action: "report", forAll: false, forReceiver: true },
      { icon: faBan, action: "block", forAll: false, forReceiver: true },
      { icon: faPaintBrush, action: "theme", forAll: true },
      { icon: faEdit, action: "update", forAll: false, forSender: true },
      { icon: faTrash, action: "delete", forAll: false, forSender: true },
    ];
    const isSender = msg.fromUserId === userId;
    return icons.filter((icon) => {
      if (icon.forAll) return true;
      if (isSender && icon.forSender) return true;
      if (!isSender && icon.forReceiver) return true;
      return false;
    });
  };

  return (
    <div className="cm-container">
      {status === "loading" && <p className="cm-loading">Loading...</p>}
      {filteredMessages.map((msg) => {
        console.log("🎨 Rendu du message dans ChatMessages:", msg);
        if (!msg.id) {
          console.warn("Message sans ID détecté, ignoré:", msg);
          return null;
        }
        const otherUserId = getOtherUserId(msg);
        const messageIcons = getIcons(msg);
        return (
          <div key={msg.id} className={`cm-message ${msg.fromUserId === userId ? "cm-sent" : "cm-received"}`}>
            <div className="cm-content">
              <p className="cm-text">
                <strong>{getContactName(msg.fromUserId)}</strong> {msg.content}
              </p>
              <div className="cm-meta">
                <span className="cm-timestamp">{new Date(msg.timestamp).toLocaleString()}</span>
                {messageIcons.map((icon, index) => (
                  <FontAwesomeIcon
                    key={index}
                    icon={icon.icon}
                    className="cm-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(icon.action, msg);
                    }}
                    title={icon.action === "update" ? "Mettre à jour" : icon.action === "delete" ? "Supprimer" : icon.action}
                  />
                ))}
              </div>
              {["contact", "addToList", "report", "block", "theme"].includes(showActions) && showActions === msg.id && (
                <div className="cm-actions">
                  {showActions === "contact" && <ContactInfo userId={otherUserId} isOpen={true} onClose={() => setShowActions(null)} selectedChatId={selectedChatId} />}
                  {showActions === "addToList" && <AddToList userId={otherUserId} onClose={() => setShowActions(null)} />}
                  {showActions === "report" && <ReportUser userId={otherUserId} messageId={msg.id} isOpen={true} onClose={() => setShowActions(null)} />}
                  {showActions === "block" && <BlockUser userId={otherUserId} isOpen={true} onClose={() => setShowActions(null)} />}
                  {showActions === "theme" && <ChatTheme chatId={msg.chatId} onClose={() => setShowActions(null)} />}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} /> {/* Élément invisible pour le défilement */}
    </div>
  );
};

export default ChatMessages;