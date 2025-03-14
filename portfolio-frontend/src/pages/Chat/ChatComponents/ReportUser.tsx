// portfolio-frontend/src/pages/Chat/ChatComponents/ReportUser.tsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "react-modal";
import { AppDispatch } from "../../../redux/store";
import "./ReportUser.css";

// Définir l'élément racine pour l'accessibilité du modal
Modal.setAppElement("#root");

interface ReportUserProps {
  userId: string;
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReportUser: React.FC<ReportUserProps> = ({ userId, messageId, isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [reason, setReason] = useState("");

  const handleReport = () => {
    console.log(`🔹 Signalement de ${userId} pour "${reason}" avec message ${messageId}`);
    // Ajouter ici une action Redux pour signaler (à implémenter dans userSlice)
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="report-user-modal"
      overlayClassName="report-user-overlay"
      contentLabel="Signaler un utilisateur"
    >
      <div className="report-user-container">
        <h2 className="report-user-title">Signaler un utilisateur</h2>
        <p className="report-user-text">Signaler {userId}</p>
        <input
          className="report-user-input"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Raison du signalement"
        />
        <div className="report-user-buttons">
          <button className="report-user-button report" onClick={handleReport}>Signaler</button>
          <button className="report-user-button cancel" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportUser;