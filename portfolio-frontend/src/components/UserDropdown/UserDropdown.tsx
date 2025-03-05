// src/components/UserDropdown/UserDropdown.tsx
import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import Modal from "./Modal";
import "./UserDropdown.css";

interface UserDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const UserDropdown = forwardRef<HTMLDivElement, UserDropdownProps>((props, ref) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { user } = useSelector((state: RootState) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = () => {
    props.onClose();
  };

  const handleMemberClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user?.firstName || !user?.lastName) {
      e.preventDefault();
      setIsModalOpen(true);
    } else {
      handleItemClick();
    }
  };

  return (
    <>
      <div className={`navbar-dropdown ${isArabic ? "arabic" : ""}`} ref={ref}>
        <button className="nav-item dropdown-toggle" onClick={props.onToggle}>
          <i className="fas fa-user-circle"></i> {t("navbar.menu")}
        </button>
        <div className={`dropdown-menu ${props.isOpen ? "active" : ""}`}>
          <Link
            to="/member"
            onClick={handleMemberClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-users"></i> {t("navbar.member")}
          </Link>
          <Link
            to="/settings"
            onClick={handleItemClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-cog"></i> {t("navbar.settings")}
          </Link>
          <Link
            to="/profile"
            onClick={handleItemClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-user"></i> {t("navbar.profile")}
          </Link>
          <Link
            to="/rencontre"
            onClick={handleItemClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-handshake"></i> {t("navbar.rencontre")}
          </Link>
          <Link
            to="/offers"
            onClick={handleItemClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-gift"></i> {t("navbar.offersReceived")}
          </Link>
          <Link
            to="/history"
            onClick={handleItemClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-history"></i> {t("navbar.contactHistory")}
          </Link>
          <Link
            to="/chat"
            onClick={handleItemClick}
            className={`dropdown-item ${isArabic ? "arabic" : ""}`}
          >
            <i className="fas fa-envelope"></i> {t("navbar.messagesReceived")}
          </Link>
          {/* Suppression de la route notifications, car intégrée dans Navbar */}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

export default UserDropdown;