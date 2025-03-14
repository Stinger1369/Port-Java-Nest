// portfolio-frontend/src/pages/Chat/ChatComponents/BlockUser.tsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";
import { AppDispatch, RootState } from "../../../redux/store";
import { blockUser } from "../../../redux/features/userSlice";
import "./BlockUser.css";

// Définir l'élément racine pour l'accessibilité du modal
Modal.setAppElement("#root");

interface BlockUserProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const BlockUser: React.FC<BlockUserProps> = ({ userId, isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUserId = useSelector((state: RootState) => state.auth.userId);

  const handleBlock = () => {
    if (currentUserId) {
      dispatch(blockUser({ blockerId: currentUserId, blockedId: userId }))
        .unwrap()
        .then(() => {
          console.log("Utilisateur bloqué avec succès");
          onClose();
        })
        .catch((error) => console.error("Erreur lors du blocage:", error));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bu-modal" // Préfixe bu-
      overlayClassName="bu-overlay" // Préfixe bu-
      contentLabel="Confirmer le blocage"
    >
      <div className="bu-container"> {/* Préfixe bu- */}
        <h2 className="bu-title">Bloquer l'utilisateur</h2>
        <p className="bu-text">Confirmer le blocage de {userId} ?</p>
        <div className="bu-buttons">
          <button className="bu-button bu-block" onClick={handleBlock}>Bloquer</button>
          <button className="bu-button bu-cancel" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </Modal>
  );
};

export default BlockUser;