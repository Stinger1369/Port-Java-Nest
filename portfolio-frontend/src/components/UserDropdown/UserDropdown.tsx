// src/components/UserDropdown/UserDropdown.tsx
import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTranslation } from "react-i18next";
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
      <div className={`userDropDown-container ${isArabic ? "arabic" : ""}`} ref={ref}>
        <button
          className="userDropDown-toggle"
          onClick={props.onToggle}
          title={user?.slug && user.slug.trim() !== "" ? user.slug : t("navbar.menu")}
        >
          <i className="fas fa-user-circle"></i>
        </button>
        <div className={`userDropDown-menu ${props.isOpen ? "active" : ""}`}>
          <Link
            to="/member"
            onClick={handleMemberClick}
            className={`userDropDown-item userDropDown-item-member ${isArabic ? "arabic" : ""}`}
            title={t("navbar.member")}
          >
            <i className="fas fa-users"></i>
            <span>{t("navbar.member")}</span>
          </Link>
          <Link
            to="/settings"
            onClick={handleItemClick}
            className={`userDropDown-item userDropDown-item-settings ${isArabic ? "arabic" : ""}`}
            title={t("navbar.settings")}
          >
            <i className="fas fa-cog"></i>
            <span>{t("navbar.settings")}</span>
          </Link>
          <Link
            to="/profile"
            onClick={handleItemClick}
            className={`userDropDown-item userDropDown-item-profile ${isArabic ? "arabic" : ""}`}
            title={t("navbar.profile")}
          >
            <i className="fas fa-user"></i>
            <span>{t("navbar.profile")}</span>
          </Link>
          <Link
            to="/rencontre"
            onClick={handleItemClick}
            className={`userDropDown-item userDropDown-item-rencontre ${isArabic ? "arabic" : ""}`}
            title={t("navbar.rencontre")}
          >
            <i className="fas fa-handshake"></i>
            <span>{t("navbar.rencontre")}</span>
          </Link>
          <Link
            to="/offers"
            onClick={handleItemClick}
            className={`userDropDown-item userDropDown-item-offers ${isArabic ? "arabic" : ""}`}
            title={t("navbar.offersReceived")}
          >
            <i className="fas fa-gift"></i>
            <span>{t("navbar.offersReceived")}</span>
          </Link>
          <Link
            to="/history"
            onClick={handleItemClick}
            className={`userDropDown-item userDropDown-item-history ${isArabic ? "arabic" : ""}`}
            title={t("navbar.contactHistory")}
          >
            <i className="fas fa-history"></i>
            <span>{t("navbar.contactHistory")}</span>
          </Link>
          <Link
            to="/chat"
            onClick={handleItemClick}
            className={`userDropDown-item userDropDown-item-chat ${isArabic ? "arabic" : ""}`}
            title={t("navbar.messagesReceived")}
          >
            <i className="fas fa-envelope"></i>
            <span>{t("navbar.messagesReceived")}</span>
          </Link>
          {/* Suppression de la route notifications, car intégrée dans Navbar */}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

export default UserDropdown;