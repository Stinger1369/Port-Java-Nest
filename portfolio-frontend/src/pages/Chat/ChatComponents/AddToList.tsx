// portfolio-frontend/src/pages/Chat/ChatComponents/AddToList.tsx
import React from "react";
import "./AddToList.css";

interface AddToListProps {
  userId: string;
  onClose: () => void;
}

const AddToList: React.FC<AddToListProps> = ({ userId, onClose }) => {
  const handleAdd = () => {
    console.log(`🔹 Ajout de ${userId} à une liste (fonctionnalité à implémenter)`);
    onClose();
  };

  return (
    <div className="add-to-list-container">
      <p className="add-to-list-text">Ajouter {userId} à une liste</p>
      <button className="add-to-list-button add" onClick={handleAdd}>Ajouter</button>
      <button className="add-to-list-button cancel" onClick={onClose}>Annuler</button>
    </div>
  );
};

export default AddToList;