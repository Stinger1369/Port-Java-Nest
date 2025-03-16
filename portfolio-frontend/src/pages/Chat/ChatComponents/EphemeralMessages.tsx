// portfolio-frontend/src/pages/Chat/ChatComponents/EphemeralMessages.tsx
import React from "react";
import Modal from "react-modal";
import "./EphemeralMessages.css";

// Définir l'élément racine pour l'accessibilité du modal
Modal.setAppElement("#root");

interface EphemeralMessagesProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EphemeralMessages: React.FC<EphemeralMessagesProps> = ({ chatId, isOpen, onClose }) => {
  const handleSetEphemeral = () => {
    console.log(`🔹 Activation des messages éphémères pour chat ${chatId} (fonctionnalité à implémenter)`);
    onClose(); // Ferme la modale après l'action
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="ephemeral-messages-modal"
      overlayClassName="ephemeral-messages-overlay"
      contentLabel="Activer les messages éphémères"
    >
      <div className="ephemeral-messages-container">
        <h2 className="ephemeral-messages-title">Messages éphémères</h2>
        <p className="ephemeral-messages-text">Activer les messages éphémères pour {chatId} ?</p>
        <div className="ephemeral-messages-buttons">
          <button className="ephemeral-messages-button activate" onClick={handleSetEphemeral}>Activer</button>
          <button className="ephemeral-messages-button cancel" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </Modal>
  );
};

export default EphemeralMessages;