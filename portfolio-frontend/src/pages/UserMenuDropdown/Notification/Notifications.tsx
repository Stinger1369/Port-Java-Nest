// src/pages/UserMenuDropdown/Notification/Notifications.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import { useNotificationActions } from "../../../hooks/useNotificationActions";
import { useTranslation } from "react-i18next";
import { useFriendActions } from "../../../hooks/useFriendActions";
import "./Notifications.css";

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const userId = localStorage.getItem("userId") || "";
  const { notifications, status, error, loadNotifications, handleMarkAsRead, handleRemoveNotification, handleClearNotifications } =
    useNotificationActions(t);
  const { friends, receivedRequests, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend } = useFriendActions();
  const [filter, setFilter] = useState<"all" | "friends" | "chat">("all");

  useEffect(() => {
    if (status !== "loading") {
      console.log("🔍 Chargement des notifications pour la page complète, userId:", userId);
      loadNotifications(userId);
    }
  }, [loadNotifications, userId, status]);

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredNotifications = sortedNotifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "friends") {
      return (
        notification.type === "friend_request_received" ||
        notification.type === "friend_request_accepted" ||
        notification.type === "friend_request_rejected" ||
        notification.type === "friend_removed"
      );
    }
    if (filter === "chat") {
      return (
        notification.type === "new_chat" ||
        notification.type === "new_private_message" ||
        notification.type === "new_group_message"
      );
    }
    return false;
  });

  const handleAccept = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleAcceptFriendRequest(friendId, (errorMessage) => alert(errorMessage));
  };

  const handleReject = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleRejectFriendRequest(friendId, (errorMessage) => alert(errorMessage));
  };

  const handleRemoveFriendAction = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleRemoveFriend(friendId, (errorMessage) => alert(errorMessage));
  };

  const isFriendRequestPending = (friendId: string) => {
    return receivedRequests.some((request) => request.id === friendId);
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
      case "friend_removed":
        return "fas fa-user-slash";
      default:
        return "fas fa-info";
    }
  };

  if (status === "loading") {
    return <div className="page-notifications-loading">{t("notification.loading")}</div>;
  }

  if (status === "failed") {
    return (
      <div className="page-notifications-error">
        {t("notification.error")} {error}
        <button onClick={() => loadNotifications(userId)}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="page-notifications-container">
      <h1>{t("notification.title")}</h1>
      <div className="page-notification-filter-buttons">
        <button
          className={`page-filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <i className="fas fa-bell"></i> {t("notification.all")}
        </button>
        <button
          className={`page-filter-button ${filter === "friends" ? "active" : ""}`}
          onClick={() => setFilter("friends")}
        >
          <i className="fas fa-users"></i> {t("notification.friends")}
        </button>
        <button
          className={`page-filter-button ${filter === "chat" ? "active" : ""}`}
          onClick={() => setFilter("chat")}
        >
          <i className="fas fa-comments"></i> {t("notification.chat")}
        </button>
      </div>
      {filteredNotifications.length === 0 ? (
        <div className="page-no-notifications">
          <i className="fas fa-bell-slash"></i>
          <p>{t("notification.noNotifications")}</p>
        </div>
      ) : (
        <div className="page-notifications-list">
          {filteredNotifications.map((notification, index) => {
            const friendId = notification.data?.fromUserId || notification.data?.friendId;
            const isPending = notification.type === "friend_request_received" && friendId && isFriendRequestPending(friendId);
            const isAccepted = friendId && isFriendRequestAccepted(friendId);

            return (
              <div key={notification.id} className={`page-notification-item ${!notification.isRead ? "page-unread" : ""}`}>
                {index > 0 && <div className="page-notification-divider"></div>}
                <div className="page-notification-content">
                  <div className="page-notification-main">
                    <i className={getIconClass(notification.type)}></i>
                    <span className="page-notification-message">{notification.message}</span>
                  </div>
                  <div className="page-notification-actions">
                    {!notification.isRead && (
                      <button
                        className="page-mark-read-button"
                        onClick={() => handleMarkAsRead(notification.id, userId)}
                        title={t("notification.markAsRead")}
                      >
                        <i className="fas fa-check-circle"></i>
                      </button>
                    )}
                    <button
                      className="page-remove-button"
                      onClick={() => handleRemoveNotification(notification.id, userId)}
                      title={t("notification.remove")}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                    {notification.type === "friend_request_received" && friendId && isPending && !isAccepted && (
                      <>
                        <button
                          className="page-accept-button"
                          onClick={(e) => handleAccept(e, friendId)}
                          title={t("notification.accept")}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          className="page-reject-button"
                          onClick={(e) => handleReject(e, friendId)}
                          title={t("notification.reject")}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    {notification.type === "friend_request_received" && friendId && isAccepted && (
                      <button
                        className="page-remove-friend-button"
                        onClick={(e) => handleRemoveFriendAction(e, friendId)}
                        title={t("notification.removeFriend")}
                      >
                        <i className="fas fa-user-minus"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="page-notification-time-wrapper">
                  <span className="page-notification-time">{new Date(notification.timestamp).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
          <button
            className="page-clear-all-button"
            onClick={() => handleClearNotifications(userId)}
          >
            <i className="fas fa-trash"></i> {t("notification.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;