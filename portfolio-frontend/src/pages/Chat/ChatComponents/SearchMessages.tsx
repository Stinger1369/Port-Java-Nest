// portfolio-frontend/src/pages/Chat/ChatComponents/SearchMessages.tsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import Modal from "react-modal";
import { RootState } from "../../../redux/store";
import { selectMessagesByChatId } from "../../../redux/features/chatSelectors";
import "./SearchMessages.css";

// Définir l'élément racine pour l'accessibilité du modal
Modal.setAppElement("#root");

interface SearchMessagesProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SearchMessages: React.FC<SearchMessagesProps> = ({ chatId, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const messages = useSelector((state: RootState) => selectMessagesByChatId(state, chatId));

  const filteredMessages = messages.filter((msg) =>
    msg.content && typeof msg.content === "string" ? msg.content.toLowerCase().includes(searchTerm.toLowerCase()) : false
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="sm-modal" // Préfixe sm-
      overlayClassName="sm-overlay" // Préfixe sm-
      contentLabel="Rechercher dans les messages"
    >
      <div className="sm-container"> {/* Préfixe sm- */}
        <h2 className="sm-title">Rechercher dans les messages</h2>
        <input
          className="sm-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher dans les messages..."
        />
        <ul className="sm-list">
          {filteredMessages.map((msg) => (
            <li key={msg.id} className="sm-list-item">{msg.content}</li>
          ))}
        </ul>
        <button className="sm-button" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
};

export default SearchMessages;