import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./UserDropdown.css";

interface UserDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const UserDropdown = forwardRef<HTMLDivElement, UserDropdownProps>((props, ref) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const handleItemClick = () => {
    props.onClose(); // Ferme le menu quand un item est cliqué
  };

  return (
    <div className={`navbar-dropdown ${isArabic ? "arabic" : ""}`} ref={ref}>
      <button className="nav-item dropdown-toggle" onClick={props.onToggle}>
        <i className="fas fa-user-circle"></i> {t("navbar.menu")}
      </button>
      <div className={`dropdown-menu ${props.isOpen ? "active" : ""}`}>
        <Link to="/member" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-users"></i> {t("navbar.member")}
        </Link>
        <Link to="/settings" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-cog"></i> {t("navbar.settings")}
        </Link>
        <Link to="/profile" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-user"></i> {t("navbar.profile")}
        </Link>
        <Link to="/rencontre" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-handshake"></i> {t("navbar.rencontre")}
        </Link>
        <Link to="/offers" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-gift"></i> {t("navbar.offersReceived")}
        </Link>
        <Link to="/messages" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-envelope"></i> {t("navbar.messagesReceived")}
        </Link>
        {/* Nouvelle entrée pour les notifications */}
        <Link to="/notifications" onClick={handleItemClick} className={`dropdown-item ${isArabic ? "arabic" : ""}`}>
          <i className="fas fa-bell"></i> {t("navbar.notifications")}
        </Link>
      </div>
    </div>
  );
});

export default UserDropdown;