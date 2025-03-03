import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t("modal.completeProfileTitle")}</h2>
        <i className="fas fa-times modal-close-icon" onClick={onClose} /> {/* Icône de fermeture */}
        <p>{t("modal.completeProfileMessage")}</p>
        <Link to="/profile" className="modal-button" onClick={onClose}>
          {t("modal.goToProfile")}
        </Link>
      </div>
    </div>
  );
};

export default Modal;