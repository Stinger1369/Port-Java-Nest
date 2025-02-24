import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import Flag from "react-flagkit";
import "./LanguageSelector.css";

interface LanguageSelectorProps {
  className?: string;
  isOpen: boolean; // Contrôlé par Navbar
  onToggle: () => void; // Contrôlé par Navbar
  onClose: () => void; // Pour fermer explicitement
}

const LanguageSelector = forwardRef<HTMLDivElement, LanguageSelectorProps>((props, ref) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    props.onClose(); // Ferme le menu après sélection
  };

  const displayLanguage = i18n.language.split("-")[0].toUpperCase();

  const languages = [
    { code: "fr", label: "Français", countryCode: "FR" },
    { code: "en", label: "English", countryCode: "GB" },
    { code: "es", label: "Español", countryCode: "ES" },
    { code: "zh", label: "中文", countryCode: "CN" },
    { code: "ar", label: "العربية", countryCode: "SA" },
  ];

  return (
    <div ref={ref} className={`navbar-language ${props.className || ""} ${isArabic ? "arabic" : ""}`}>
      <button className="language-toggle" onClick={props.onToggle}>
        <span className="toggle-content">
          <i className="fas fa-globe"></i> {displayLanguage}
        </span>
      </button>
      <div className={`language-dropdown ${props.isOpen ? "active" : ""}`}>
        {languages.map((lang) => (
          <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={isArabic ? "arabic" : ""}>
            <span className="dropdown-item-content">
              <Flag country={lang.countryCode} size={20} /> {lang.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default LanguageSelector;