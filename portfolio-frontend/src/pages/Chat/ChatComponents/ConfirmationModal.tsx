// portfolio-frontend/src/pages/Chat/ChatComponents/ConfirmationModal.tsx
import React from "react";
import Modal from "react-modal";
import "./ConfirmationModal.css";

// Définir l'élément racine pour l'accessibilité
Modal.setAppElement("#root");

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isInput?: boolean; // Pour la modale de mise à jour avec champ texte
  inputValue?: string; // Valeur initiale pour le champ texte
  onInputChange?: (value: string) => void; // Mise à jour de la valeur du champ
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isInput = false,
  inputValue = "",
  onInputChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="confirm-modal"
      overlayClassName="confirm-overlay"
      contentLabel={title}
    >
      <div className="confirm-container">
        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        {isInput && (
          <textarea
            className="confirm-input"
            value={inputValue}
            onChange={(e) => onInputChange && onInputChange(e.target.value)}
            placeholder="Entrez le nouveau contenu"
          />
        )}
        <div className="confirm-buttons">
          <button className="confirm-button confirm" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="confirm-button cancel" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;