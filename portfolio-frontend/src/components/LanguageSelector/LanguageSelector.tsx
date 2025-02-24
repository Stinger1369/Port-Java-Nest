import { useState } from "react";
import { useTranslation } from "react-i18next";
import Flag from "react-flagkit"; // Importer la bibliothèque de drapeaux
import "./LanguageSelector.css";

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector = ({ className = "" }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const toggleLanguageMenu = () => {
    setIsLanguageOpen(!isLanguageOpen);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setIsLanguageOpen(false);
  };

  const displayLanguage = i18n.language.split("-")[0].toUpperCase();

  // Liste des langues avec leurs codes pays pour les drapeaux et labels
  const languages = [
    { code: "fr", label: "Français", countryCode: "FR" },
    { code: "en", label: "English", countryCode: "GB" }, // Ou "US" pour USA
    { code: "es", label: "Español", countryCode: "ES" },
    { code: "zh", label: "中文", countryCode: "CN" },
    { code: "ar", label: "العربية", countryCode: "SA" }, // Exemple : Arabie Saoudite
  ];

  return (
    <div className={`navbar-language ${className}`}>
      <button className="language-toggle" onClick={toggleLanguageMenu}>
        <i className="fas fa-globe"></i> {displayLanguage}
      </button>
      <div className={`language-dropdown ${isLanguageOpen ? "active" : ""}`}>
        {languages.map((lang) => (
          <button key={lang.code} onClick={() => changeLanguage(lang.code)}>
            <Flag country={lang.countryCode} size={20} /> {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;