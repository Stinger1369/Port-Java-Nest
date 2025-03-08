// src/components/NotificationDropdown.tsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../redux/store";
import { useNotificationActions } from "../../hooks/useNotificationActions";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useFriendActions } from "../../hooks/useFriendActions";
import "./NotificationDropdown.css";
import { resetStatus } from "../../redux/features/notificationSlice";

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onToggle, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { notifications, status, error, loadNotifications, handleMarkAsRead, handleRemoveNotification, handleClearNotifications, handleNotificationAction } =
    useNotificationActions(t);
  const { friends, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend } = useFriendActions();
  const userId = localStorage.getItem("userId") || "";

  const [refresh, setRefresh] = useState(false);
  const [noNotifications, setNoNotifications] = useState(false);
  const isInitialMount = useRef(true);
  const lastFetchTimestamp = useRef<number | null>(null);

  // Recharger les notifications uniquement au montage initial ou sur refresh explicite
  useEffect(() => {
    let mounted = true;
    if (mounted && (isInitialMount.current || refresh)) {
      console.log("🔍 Chargement initial ou sur refresh pour userId:", userId);
      loadNotifications(userId);
      isInitialMount.current = false;
      setRefresh(false);
    }
    return () => {
      mounted = false;
    };
  }, [loadNotifications, userId, refresh]);

  // Recharger à l'ouverture uniquement si nécessaire
  useEffect(() => {
    let mounted = true;
    if (mounted && isOpen && status !== "loading" && status !== "succeeded") {
      console.log("🔍 Chargement à l'ouverture du dropdown pour userId:", userId);
      loadNotifications(userId);
    }
    return () => {
      mounted = false;
    };
  }, [loadNotifications, userId, isOpen, status]);

  // Recharger périodiquement uniquement si nécessaire
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      const now = Date.now();
      if (mounted && isOpen && status !== "loading" && !noNotifications && (!lastFetchTimestamp.current || now - lastFetchTimestamp.current >= 30000)) {
        console.log("🔄 Rechargement périodique des notifications pour userId:", userId);
        loadNotifications(userId);
        lastFetchTimestamp.current = now;
      } else if (noNotifications) {
        console.log("ℹ️ Rechargement périodique arrêté car il n'y a pas de notifications pour userId:", userId);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadNotifications, userId, status, isOpen, noNotifications]);

  // Mettre à jour noNotifications en fonction du state
  useEffect(() => {
    if (status === "succeeded") {
      const hasNoNotifications = notifications.length === 0;
      setNoNotifications(hasNoNotifications);
      if (hasNoNotifications) {
        console.log("✅ Aucune notification détectée pour userId:", userId);
      } else {
        console.log("✅ Notifications détectées:", notifications);
      }
    }
  }, [status, notifications.length, userId]);

  useEffect(() => {
    if (status === "failed" && error?.includes("Failed to fetch")) {
      dispatch(resetStatus());
      console.warn("⚠️ Erreur réseau détectée, statut réinitialisé:", error);
    }
  }, [status, error, dispatch]);

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const unreadCount = sortedNotifications.filter((notif) => !notif.isRead).length;

  const handleNotificationClick = (notification: any) => {
    switch (notification.type) {
      case "new_chat":
      case "new_private_message":
        navigate(`/chat/private/${notification.data?.chatId || "default"}`);
        break;
      case "new_group_message":
        navigate(`/chat/group/${notification.data?.groupId || "default"}`);
        break;
      case "friend_request_received":
      case "friend_request_accepted":
        navigate("/member");
        break;
      default:
        console.log("📩 Type de notification non géré:", notification.type);
    }
    handleMarkAsRead(notification.id, userId);
    onClose();
  };

  const handleToggle = () => {
    onToggle();
    if (!isOpen && unreadCount > 0) {
      // Optionnel : marquer toutes comme lues à l'ouverture
      // dispatch(markAllNotificationsAsRead());
    }
  };

  const handleAccept = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleAcceptFriendRequest(friendId, (errorMessage) => {
      alert(errorMessage);
    });
  };

  const handleReject = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleRejectFriendRequest(friendId, (errorMessage) => {
      alert(errorMessage);
    });
  };

  const handleRemoveFriendAction = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleRemoveFriend(friendId, (errorMessage) => {
      alert(errorMessage);
    });
  };

  const isFriendRequestAccepted = (friendId: string) => {
    return friends.some((friend) => friend.id === friendId);
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case "new_chat":
      case "new_private_message":
      case "new_group_message":
        return "fas fa-envelope";
      case "friend_request_received":
        return "fas fa-user-plus";
      case "friend_request_accepted":
        return "fas fa-user-check";
      case "friend_request_rejected":
        return "fas fa-user-times";
      default:
        return "fas fa-info";
    }
  };

  const getSecondaryIconClass = (type: string) => {
    switch (type) {
      case "friend_request_received":
      case "friend_request_accepted":
      case "friend_request_rejected":
        return "fas fa-bell";
      case "new_chat":
      case "new_private_message":
      case "new_group_message":
        return "fas fa-comment-dots";
      default:
        return "fas fa-info-circle";
    }
  };

  if (status === "loading") {
    return <div className="notification-loading">{t("notification.loading")}</div>;
  }
  if (status === "failed") {
    return (
      <div className="notification-error">
        {t("notification.error")} {error}
        <button onClick={() => { loadNotifications(userId); dispatch(resetStatus()); setRefresh(true); }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="navbar-notifications">
      <button
        className={`nav-item ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={handleToggle}
        title={t("navbar.notifications")}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      <div className={`dropdown-menu ${isOpen ? "active" : ""}`}>
        {noNotifications || unreadCount === 0 ? (
          <div className="dropdown-item no-notifications">
            <div className="icon-group">
              <i className="fas fa-bell-slash"></i>
            </div>
            <span>{t("notification.noNotifications")}</span>
          </div>
        ) : (
          <>
            {sortedNotifications.map((notification, index) => {
              const isAccepted = notification.type === "friend_request_received" && isFriendRequestAccepted(notification.data?.fromUserId);
              return (
                <div key={notification.id}>
                  {index > 0 && <div className="notification-divider"></div>}
                  <div
                    className={`dropdown-item ${!notification.isRead ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="icon-group">
                      <i className={getIconClass(notification.type)}></i>
                      <i className={getSecondaryIconClass(notification.type)}></i>
                    </div>
                    <div className="notification-content">
                      <span className="notification-message">{notification.message}</span>
                      <span className="notification-time">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="action-buttons">
                      {!notification.isRead && (
                        <button
                          className="mark-read-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id, userId);
                          }}
                          title={t("notification.markAsRead")}
                        >
                          <i className="fas fa-check-circle"></i>
                        </button>
                      )}
                      <button
                        className="remove-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveNotification(notification.id);
                        }}
                        title={t("notification.remove")}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                      {notification.type === "friend_request_received" && notification.data?.fromUserId && !isAccepted && (
                        <div className="notification-actions">
                          <button
                            className="accept-button"
                            onClick={(e) => handleAccept(e, notification.data.fromUserId)}
                            title={t("notification.accept")}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="reject-button"
                            onClick={(e) => handleReject(e, notification.data.fromUserId)}
                            title={t("notification.reject")}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                      {notification.type === "friend_request_received" && notification.data?.fromUserId && isAccepted && (
                        <button
                          className="remove-friend-button"
                          onClick={(e) => handleRemoveFriendAction(e, notification.data.fromUserId)}
                          title={t("notification.removeFriend")}
                        >
                          <i className="fas fa-user-minus"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="notification-divider"></div>
            <button
              className="dropdown-item clear-button"
              onClick={() => handleClearNotifications(userId)}
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