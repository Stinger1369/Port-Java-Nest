// portfolio-frontend/src/pages/Chat/ChatComponents/ChatTheme.tsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Modal from "react-modal";
import { RootState } from "../../../redux/store";
import "./ChatTheme.css";

interface ChatThemeProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (theme: string) => void;
  getContactName: (contactId: string) => string;
}

const ChatTheme: React.FC<ChatThemeProps> = ({ chatId, isOpen, onClose, onApply, getContactName }) => {
  const { theme } = useSelector((state: RootState) => state.chat);
  const [selectedTheme, setSelectedTheme] = useState(theme);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(e.target.value);
  };

  const handleApply = () => {
    console.log(`🔹 Application du thème ${selectedTheme} pour chatId: ${chatId}`);
    onApply(selectedTheme);
    onClose();
  };

  const getChatTitle = () => {
    const contactId = chatId;
    const title = getContactName(contactId);
    return title === contactId ? `Conversation ${chatId}` : title;
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="chat-theme-modal"
      overlayClassName="chat-theme-overlay"
      contentLabel="Choisir un thème"
      parentSelector={() => document.body}
    >
      <div className="chat-theme-content">
        <h2>Choisir un thème pour {getChatTitle()}</h2>
        <select value={selectedTheme} onChange={handleThemeChange} className="theme-select">
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
        <div className="chat-theme-buttons">
          <button onClick={handleApply} className="apply-button">
            Appliquer
          </button>
          <button onClick={onClose} className="cancel-button">
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChatTheme;