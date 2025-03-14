// portfolio-frontend/src/pages/Chat/ChatComponents/MessageMenu.tsx
import React, { useState, memo } from "react";
import ContactInfo from "./ContactInfo";
import AddToList from "./AddToList";
import ReportUser from "./ReportUser";
import BlockUser from "./BlockUser";
import ChatTheme from "./ChatTheme";
import "./MessageMenu.css";

interface MessageMenuProps {
  message: { id: string; chatId: string; fromUserId: string; toUserId?: string; content: string };
  onClose: () => void;
  otherUserId: string;
  userId: string | null; // Prop pour l'ID de l'utilisateur connecté
}

const MessageMenu: React.FC<MessageMenuProps> = ({ message, onClose, otherUserId, userId }) => {
  const isSender = message.fromUserId === userId;

  // Rendu conditionnel des composants en fonction de l'action
  if (userId) {
    if (isSender) {
      return (
        <div className="mm-actions">
          <ContactInfo userId={otherUserId} isOpen={true} onClose={onClose} selectedChatId={message.chatId} />
          <AddToList userId={otherUserId} onClose={onClose} />
          <ChatTheme chatId={message.chatId} onClose={onClose} />
        </div>
      );
    } else {
      return (
        <div className="mm-actions">
          <ContactInfo userId={otherUserId} isOpen={true} onClose={onClose} selectedChatId={message.chatId} />
          <AddToList userId={otherUserId} onClose={onClose} />
          <ReportUser userId={otherUserId} messageId={message.id} isOpen={true} onClose={onClose} />
          <BlockUser userId={otherUserId} isOpen={true} onClose={onClose} />
          <ChatTheme chatId={message.chatId} onClose={onClose} />
        </div>
      );
    }
  }
  return null;
};

export default memo(MessageMenu);