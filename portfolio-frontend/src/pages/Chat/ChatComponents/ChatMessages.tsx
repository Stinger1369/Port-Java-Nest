// portfolio-frontend/src/pages/Chat/ChatComponents/ChatMessages.tsx
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { updateMessage, deleteMessage } from "../../../redux/features/chatSlice";
import ContactInfo from "./ContactInfo";
import AddToList from "./AddToList";
import ReportUser from "./ReportUser";
import BlockUser from "./BlockUser";
import ConfirmationModal from "./ConfirmationModal"; // Importer la nouvelle modale
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faList, faFlag, faBan, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
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
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ selectedChatId, userId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, status } = useSelector((state: RootState) => state.chat);
  const { members } = useSelector((state: RootState) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // États pour les modales existantes
  const [showContactInfo, setShowContactInfo] = useState<{ [key: string]: boolean }>({});
  const [showAddToList, setShowAddToList] = useState<{ [key: string]: boolean }>({});
  const [showReport, setShowReport] = useState<{ [key: string]: boolean }>({});
  const [showBlock, setShowBlock] = useState<{ [key: string]: boolean }>({});

  // États pour les nouvelles modales de confirmation
  const [showUpdateModal, setShowUpdateModal] = useState<{ [key: string]: boolean }>({});
  const [showDeleteModal, setShowDeleteModal] = useState<{ [key: string]: boolean }>({});
  const [updateContent, setUpdateContent] = useState<{ [key: string]: string }>({});

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      console.log("⏬ Défilement vers le bas effectué");
    }
  };

  useEffect(() => {
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

  const getOtherUserId = (msg: Message) => {
    return msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
  };

  const getIcons = (msg: Message) => {
    const icons = [
      { icon: faUser, action: "contact", forAll: true },
      { icon: faList, action: "addToList", forAll: true },
      { icon: faFlag, action: "report", forAll: false, forReceiver: true },
      { icon: faBan, action: "block", forAll: false, forReceiver: true },
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

  const handleAction = (action: string, msg: Message) => {
    console.log(`👉 Action déclenchée: ${action} pour le message ${msg.id}`);
    switch (action) {
      case "update":
        setUpdateContent((prev) => ({ ...prev, [msg.id]: msg.content }));
        setShowUpdateModal((prev) => ({ ...prev, [msg.id]: true }));
        break;
      case "delete":
        setShowDeleteModal((prev) => ({ ...prev, [msg.id]: true }));
        break;
      case "contact":
        setShowContactInfo((prev) => ({ ...prev, [msg.id]: true }));
        console.log(`👤 Affichage de ContactInfo pour le message ${msg.id}`);
        break;
      case "addToList":
        setShowAddToList((prev) => ({ ...prev, [msg.id]: true }));
        console.log(`📋 Affichage d'AddToList pour le message ${msg.id}`);
        break;
      case "report":
        setShowReport((prev) => ({ ...prev, [msg.id]: true }));
        console.log(`🚨 Affichage de ReportUser pour le message ${msg.id}`);
        break;
      case "block":
        setShowBlock((prev) => ({ ...prev, [msg.id]: true }));
        console.log(`🚫 Affichage de BlockUser pour le message ${msg.id}`);
        break;
      default:
        break;
    }
  };

  const handleUpdateConfirm = (msgId: string) => {
    const newContent = updateContent[msgId];
    if (newContent && newContent.trim() !== messages.find((m) => m.id === msgId)?.content) {
      dispatch(updateMessage({ id: msgId, content: newContent }))
        .unwrap()
        .then(() => console.log("✅ Message mis à jour avec succès"))
        .catch((error) => console.error("❌ Erreur lors de la mise à jour:", error));
    }
    setShowUpdateModal((prev) => ({ ...prev, [msgId]: false }));
  };

  const handleDeleteConfirm = (msgId: string) => {
    dispatch(deleteMessage(msgId))
      .unwrap()
      .then(() => console.log("✅ Message supprimé avec succès"))
      .catch((error) => console.error("❌ Erreur lors de la suppression:", error));
    setShowDeleteModal((prev) => ({ ...prev, [msgId]: false }));
  };

  const filteredMessages = selectedChatId
    ? messages.filter((msg) => {
        if (msg.chatId === selectedChatId) return true;
        if (selectedChatId.startsWith("temp-")) {
          const tempUserId = selectedChatId.replace("temp-", "");
          return (
            (msg.toUserId === userId && msg.fromUserId === tempUserId) ||
            (msg.fromUserId === userId && msg.toUserId === tempUserId)
          );
        }
        const tempChatId = `temp-${msg.fromUserId === userId ? msg.toUserId : msg.fromUserId}`;
        return selectedChatId === tempChatId && (msg.fromUserId === userId || msg.toUserId === userId);
      })
    : [];

  return (
    <div className="cm-container">
      {status === "loading" && <p className="cm-loading">Loading...</p>}
      {filteredMessages.map((msg) => {
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
                    title={
                      icon.action === "update"
                        ? "Mettre à jour"
                        : icon.action === "delete"
                        ? "Supprimer"
                        : icon.action === "contact"
                        ? "Afficher le contact"
                        : icon.action === "addToList"
                        ? "Ajouter à une liste"
                        : icon.action === "report"
                        ? "Signaler"
                        : icon.action === "block"
                        ? "Bloquer"
                        : icon.action
                    }
                  />
                ))}
              </div>
              {/* Modales existantes */}
              <ContactInfo
                userId={otherUserId}
                isOpen={showContactInfo[msg.id] || false}
                onClose={() => setShowContactInfo((prev) => ({ ...prev, [msg.id]: false }))}
                selectedChatId={selectedChatId}
              />
              <AddToList
                userId={otherUserId}
                isOpen={showAddToList[msg.id] || false}
                onClose={() => setShowAddToList((prev) => ({ ...prev, [msg.id]: false }))}
              />
              <ReportUser
                userId={otherUserId}
                messageId={msg.id}
                isOpen={showReport[msg.id] || false}
                onClose={() => setShowReport((prev) => ({ ...prev, [msg.id]: false }))}
              />
              <BlockUser
                userId={otherUserId}
                isOpen={showBlock[msg.id] || false}
                onClose={() => setShowBlock((prev) => ({ ...prev, [msg.id]: false }))}
              />
              {/* Nouvelles modales de confirmation */}
              <ConfirmationModal
                isOpen={showUpdateModal[msg.id] || false}
                onClose={() => setShowUpdateModal((prev) => ({ ...prev, [msg.id]: false }))}
                onConfirm={() => handleUpdateConfirm(msg.id)}
                title="Mettre à jour le message"
                message="Modifiez le contenu du message ci-dessous :"
                confirmText="Mettre à jour"
                cancelText="Annuler"
                isInput={true}
                inputValue={updateContent[msg.id] || ""}
                onInputChange={(value) => setUpdateContent((prev) => ({ ...prev, [msg.id]: value }))}
              />
              <ConfirmationModal
                isOpen={showDeleteModal[msg.id] || false}
                onClose={() => setShowDeleteModal((prev) => ({ ...prev, [msg.id]: false }))}
                onConfirm={() => handleDeleteConfirm(msg.id)}
                title="Supprimer le message"
                message="Voulez-vous vraiment supprimer ce message ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
              />
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;