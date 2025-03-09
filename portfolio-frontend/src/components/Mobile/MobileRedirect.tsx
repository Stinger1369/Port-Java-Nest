// src/components/MobileRedirect.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { isIOS, isAndroid } from "../../utils/detectMobile";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import ModalMobile from "./ModalMobile"; // Importer le nouveau composant
import "./MobileRedirect.css";

const MobileRedirect: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // Déterminer le type d'appareil
  const isIOSDevice = isIOS();
  const isAndroidDevice = isAndroid();

  // URL des stores (placeholders pour le moment)
  const iosStoreLink = "https://www.apple.com/app-store/";
  const androidStoreLink = "https://play.google.com/store";

  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleLanguage = () => setIsLanguageOpen(!isLanguageOpen);
  const closeLanguage = () => setIsLanguageOpen(false);

  return (
    <div className="mobile-redirect-container">
      <div className="futuristic-overlay">
        <LanguageSelector
          className="language-selector"
          isOpen={isLanguageOpen}
          onToggle={toggleLanguage}
          onClose={closeLanguage}
        />
        <div className="neon-title">
          <h1>{t("mobileRedirect.title")}</h1>
        </div>
        <p className="futuristic-text">{t("mobileRedirect.message")}</p>
        <div className="feature-icons">
          <i className="fas fa-comments feature-icon chat" title={t("features.chat")}></i>
          <i className="fas fa-user-friends feature-icon friends" title={t("features.friends")}></i>
          <i className="fas fa-heart feature-icon rencontre" title={t("features.rencontre")}></i>
          <i className="fas fa-briefcase feature-icon portfolio" title={t("features.portfolio")}></i>
          <i className="fas fa-tools feature-icon skills" title={t("features.skills")}></i>
          <i className="fas fa-history feature-icon experience" title={t("features.experience")}></i>
          <i className="fas fa-certificate feature-icon certif" title={t("features.certifications")}></i>
          <i className="fas fa-globe feature-icon social" title={t("features.social")}></i>
        </div>
        <div className="store-links">
          <div className="button-column">
            {isAndroidDevice && (
              <a
                href={androidStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="store-button android animate-pulse"
              >
                <i className="fab fa-android"></i>
                <span>{t("mobileRedirect.android")}</span>
              </a>
            )}
            {isIOSDevice && (
              <a
                href={iosStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="store-button ios animate-pulse"
              >
                <i className="fab fa-apple"></i>
                <span>{t("mobileRedirect.ios")}</span>
              </a>
            )}
            {!isIOSDevice && !isAndroidDevice && (
              <>
                <a
                  href={androidStoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-button android animate-pulse"
                >
                  <i className="fab fa-android"></i>
                  <span>{t("mobileRedirect.android")}</span>
                </a>
                <a
                  href={iosStoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-button ios animate-pulse"
                >
                  <i className="fab fa-apple"></i>
                  <span>{t("mobileRedirect.ios")}</span>
                </a>
              </>
            )}
          </div>
          <button className="info-button animate-pulse" onClick={toggleModal}>
            <i className="fas fa-info-circle"></i> {t("mobileRedirect.about")}
          </button>
        </div>
      </div>

      {/* Utiliser le composant ModalMobile */}
      <ModalMobile isOpen={isModalOpen} onClose={toggleModal} />
    </div>
  );
};

export default MobileRedirect;