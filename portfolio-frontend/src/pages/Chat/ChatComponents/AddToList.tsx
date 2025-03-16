// portfolio-frontend/src/pages/Chat/ChatComponents/AddToList.tsx
import React from "react";
import Modal from "react-modal";
import "./AddToList.css";

// Définir l'élément racine pour l'accessibilité du modal
Modal.setAppElement("#root");

interface AddToListProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddToList: React.FC<AddToListProps> = ({ userId, isOpen, onClose }) => {
  const handleAdd = () => {
    console.log(`🔹 Ajout de ${userId} à une liste (fonctionnalité à implémenter)`);
    onClose(); // Ferme la modale après l'action
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="add-to-list-modal"
      overlayClassName="add-to-list-overlay"
      contentLabel="Ajouter à une liste"
    >
      <div className="add-to-list-container">
        <p className="add-to-list-text">Ajouter {userId} à une liste</p>
        <div className="add-to-list-buttons">
          <button className="add-to-list-button add" onClick={handleAdd}>Ajouter</button>
          <button className="add-to-list-button cancel" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </Modal>
  );
};

export default AddToList;