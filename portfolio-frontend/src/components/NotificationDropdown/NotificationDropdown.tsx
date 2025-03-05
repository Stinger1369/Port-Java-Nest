import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../redux/store";
import { clearNotifications, markAllNotificationsAsRead } from "../../redux/features/notificationSlice";
import { useTranslation } from "react-i18next";
import "./NotificationDropdown.css";

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  unreadCount: number; // Prop ajoutée pour recevoir le nombre de notifications non lues
}

const NotificationDropdown = ({ isOpen, onToggle, onClose, unreadCount }: NotificationDropdownProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: { type: string; chatId?: string; groupId?: string }) => {
    if (notification.type === "new_message" && notification.chatId) {
      navigate(`/chat/private/${notification.chatId}`);
    } else if (notification.type === "new_group_message" && notification.groupId) {
      navigate(`/chat/group/${notification.groupId}`);
    } else if (notification.type === "friend_request" || notification.type === "friend_request_accepted") {
      navigate("/member");
    }
    onClose(); // Ferme le dropdown après clic
  };

  // Gérer l'ouverture/fermeture et marquer comme lu
  const handleToggle = () => {
    onToggle();
    if (!isOpen && unreadCount > 0) {
      dispatch(markAllNotificationsAsRead());
    }
  };

  return (
    <div className="navbar-notifications">
      <button
        className={`nav-item ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={handleToggle}
        title={t("navbar.notifications")} // Tooltip pour le texte "Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      <div className={`dropdown-menu ${isOpen ? "active" : ""}`}>
        {unreadCount === 0 ? (
          <div className="dropdown-item no-notifications">{t("navbar.noNotifications")}</div>
        ) : (
          <>
            <div className="dropdown-item" onClick={() => handleNotificationClick({ type: "friend_request" })}>
              <i className="fas fa-user-friends"></i>
              <span className="notification-message">{t("navbar.viewNotifications")}</span>
            </div>
            <button
              className="dropdown-item clear-button"
              onClick={() => dispatch(clearNotifications())}
            >
              <i className="fas fa-trash"></i> {t("navbar.clearNotifications")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;