import React, { useEffect, useState, useCallback, memo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { useNotificationActions } from "../../../hooks/useNotificationActions";
import { useTranslation } from "react-i18next";
import { useFriendActions } from "../../../hooks/useFriendActions";
import "./Notifications.css";

interface NotificationItemProps {
  notification: any;
  userId: string;
  isPending: boolean;
  isAccepted: boolean;
  friendId: string | undefined;
  handleMarkAsRead: (notificationId: string, userId: string) => void;
  openRemoveModal: (notificationId: string) => void;
  handleAccept: (e: React.MouseEvent, friendId: string) => void;
  handleReject: (e: React.MouseEvent, friendId: string) => void;
  handleRemoveFriendAction: (e: React.MouseEvent, friendId: string) => void;
  getIconClass: (type: string) => string;
  t: (key: string) => string;
  index: number;
}

const NotificationItem = memo(
  ({
    notification,
    userId,
    isPending,
    isAccepted,
    friendId,
    handleMarkAsRead,
    openRemoveModal,
    handleAccept,
    handleReject,
    handleRemoveFriendAction,
    getIconClass,
    t,
    index,
  }: NotificationItemProps) => {
    useEffect(() => {
      console.log(`🔄 NotificationItem (page) re-rendu pour ID: ${notification.id}`);
    }, [notification.id]); // Dépendance explicite pour limiter les logs

    return (
      <div className={`page-notification-item ${!notification.isRead ? "page-unread" : ""}`}>
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
              onClick={() => openRemoveModal(notification.id)}
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
  },
  (prevProps, nextProps) =>
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.isRead === nextProps.notification.isRead &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.isAccepted === nextProps.isAccepted &&
    prevProps.handleMarkAsRead === nextProps.handleMarkAsRead &&
    prevProps.openRemoveModal === nextProps.openRemoveModal &&
    prevProps.handleAccept === nextProps.handleAccept &&
    prevProps.handleReject === nextProps.handleReject &&
    prevProps.handleRemoveFriendAction === nextProps.handleRemoveFriendAction &&
    prevProps.getIconClass === nextProps.getIconClass &&
    prevProps.t === nextProps.t
);

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const userId = localStorage.getItem("userId") || "";
  const { notifications, status, error, loadNotifications, handleMarkAsRead, handleRemoveNotification, handleClearNotifications } = useNotificationActions(t);
  const { friends, receivedRequests, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend } = useFriendActions();
  const [filter, setFilter] = useState<"all" | "friends" | "chat" | "likes">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"remove" | "clear" | null>(null);
  const [notificationToRemove, setNotificationToRemove] = useState<string | null>(null);
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (isInitialMount.current && status !== "loading") {
      console.log("🔍 Chargement initial des notifications pour la page complète, userId:", userId);
      loadNotifications(userId);
      isInitialMount.current = false;
    }
  }, [loadNotifications, userId, status]);

  const sortedNotifications = React.useMemo(
    () => [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [notifications]
  );

  const filteredNotifications = React.useMemo(() =>
    sortedNotifications.filter((notification) => {
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
      if (filter === "likes") {
        return notification.type === "user_like" || notification.type === "user_unlike";
      }
      return false;
    }), [sortedNotifications, filter]);

  const handleAccept = useCallback((e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleAcceptFriendRequest(friendId, (errorMessage) => alert(errorMessage));
  }, [handleAcceptFriendRequest]);

  const handleReject = useCallback((e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleRejectFriendRequest(friendId, (errorMessage) => alert(errorMessage));
  }, [handleRejectFriendRequest]);

  const handleRemoveFriendAction = useCallback((e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleRemoveFriend(friendId, (errorMessage) => alert(errorMessage));
  }, [handleRemoveFriend]);

  const openRemoveModal = useCallback((notificationId: string) => {
    setModalAction("remove");
    setNotificationToRemove(notificationId);
    setIsModalOpen(true);
  }, []);

  const openClearModal = useCallback(() => {
    setModalAction("clear");
    setIsModalOpen(true);
  }, []);

  const handleConfirmModal = useCallback(() => {
    if (modalAction === "remove" && notificationToRemove) {
      handleRemoveNotification(notificationToRemove, userId);
    } else if (modalAction === "clear") {
      handleClearNotifications(userId);
    }
    setIsModalOpen(false);
    setModalAction(null);
    setNotificationToRemove(null);
  }, [modalAction, notificationToRemove, handleRemoveNotification, handleClearNotifications, userId]);

  const handleCancelModal = useCallback(() => {
    setIsModalOpen(false);
    setModalAction(null);
    setNotificationToRemove(null);
  }, []);

  const handleCloseModal = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancelModal();
    }
  }, [handleCancelModal]);

  const isFriendRequestPending = useCallback((friendId: string) =>
    receivedRequests.some((request) => request.id === friendId), [receivedRequests]);

  const isFriendRequestAccepted = useCallback((friendId: string) =>
    friends.some((friend) => friend.id === friendId), [friends]);

  const getIconClass = useCallback((type: string) => {
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
      case "user_like":
        return "fas fa-thumbs-up";
      case "user_unlike":
        return "fas fa-thumbs-down";
      default:
        return "fas fa-info";
    }
  }, []);

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
        <button
          className={`page-filter-button ${filter === "likes" ? "active" : ""}`}
          onClick={() => setFilter("likes")}
        >
          <i className="fas fa-thumbs-up"></i> {t("notification.likes")}
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
            const friendId = notification.data?.fromUserId || notification.data?.friendId || notification.data?.likerId;
            const isPending = notification.type === "friend_request_received" && friendId && isFriendRequestPending(friendId);
            const isAccepted = friendId && isFriendRequestAccepted(friendId);

            return (
              <NotificationItem
                key={notification.id}
                notification={notification}
                userId={userId}
                isPending={isPending}
                isAccepted={isAccepted}
                friendId={friendId}
                handleMarkAsRead={handleMarkAsRead}
                openRemoveModal={openRemoveModal}
                handleAccept={handleAccept}
                handleReject={handleReject}
                handleRemoveFriendAction={handleRemoveFriendAction}
                getIconClass={getIconClass}
                t={t}
                index={index}
              />
            );
          })}
          <button className="page-clear-all-button" onClick={openClearModal}>
            <i className="fas fa-trash"></i> {t("notification.clearAll")}
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content">
            <button className="modal-close-button" onClick={handleCancelModal}>
              <i className="fas fa-times"></i>
            </button>
            <h2>{modalAction === "remove" ? t("notification.confirmRemoveTitle") : t("notification.confirmClear")}</h2>
            <p>
              {modalAction === "remove"
                ? t("notification.confirmRemoveMessage")
                : t("notification.confirmClear")}
            </p>
            <div className="modal-actions">
              <button className="modal-confirm-button" onClick={handleConfirmModal}>
                {t("notification.yes")}
              </button>
              <button className="modal-cancel-button" onClick={handleCancelModal}>
                {t("notification.no")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;