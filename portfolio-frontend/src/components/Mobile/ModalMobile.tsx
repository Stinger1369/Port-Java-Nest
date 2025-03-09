// src/components/ModalMobile.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import "./ModalMobile.css";

interface ModalMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalMobile: React.FC<ModalMobileProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-mobile-overlay">
      <div className="modal-mobile-content">
        {/* Nouveau div pour le header contenant le bouton de fermeture */}
        <div className="modal-mobile-header">
          <button className="modal-mobile-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <h2 className="modal-mobile-title">{t("modal.title")}</h2>
        <div className="modal-mobile-section">
          <h3>{t("modal.technologies")}</h3>
          <p>{t("modal.frontend")}</p>
          <ul>
            <li><strong>Vite.js</strong>: {t("modal.vite")}</li>
            <li><strong>React 19</strong>: {t("modal.react")}</li>
            <li><strong>Redux Toolkit</strong>: {t("modal.redux")}</li>
            <li><strong>WebSocket (SockJS)</strong>: {t("modal.websocket")}</li>
            <li><strong>i18next</strong>: {t("modal.i18n")}</li>
            <li><strong>TypeScript</strong>: {t("modal.typescript")}</li>
            <li><strong>Axios</strong>: {t("modal.axios")}</li>
            <li><strong>FontAwesome</strong>: {t("modal.fontawesome")}</li>
          </ul>
          <p>{t("modal.backend")}</p>
          <ul>
            <li><strong>Spring Boot</strong>: {t("modal.spring")}</li>
            <li><strong>MongoDB</strong>: {t("modal.mongodb")}</li>
            <li><strong>JWT</strong>: {t("modal.jwt")}</li>
            <li><strong>WebSocket</strong>: {t("modal.websocketBackend")}</li>
            <li><strong>Spring Security</strong>: {t("modal.springSecurity")}</li>
            <li><strong>Spring Data MongoDB</strong>: {t("modal.springData")}</li>
            <li><strong>JavaMail</strong>: {t("modal.javamail")}</li>
          </ul>
        </div>
        <div className="modal-mobile-section">
          <h3>{t("modal.features")}</h3>
          <p>{t("modal.featuresDesc")}</p>
          <ul>
            <li>{t("modal.featurePortfolio")}</li>
            <li>{t("modal.featureMeet")}</li>
            <li>{t("modal.featureChat")}</li>
            <li>{t("modal.featureSocial")}</li>
            <li>{t("modal.featureMultiLang")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModalMobile;