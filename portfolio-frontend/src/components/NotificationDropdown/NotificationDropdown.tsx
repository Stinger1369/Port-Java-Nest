import React, { useEffect, forwardRef, useCallback, useState, useRef, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../redux/store";
import { useNotificationActions } from "../../hooks/useNotificationActions";
import { useTranslation } from "react-i18next";
import { useFriendActions } from "../../hooks/useFriendActions";
import { fetchUserById } from "../../redux/features/userSlice";
import { getAllImagesByUserId, Image } from "../../redux/features/imageSlice";
import "./NotificationDropdown.css";
import { resetStatus } from "../../redux/features/notificationSlice";

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface NotificationItemProps {
  notification: any;
  userId: string;
  isPending: boolean;
  isAccepted: boolean;
  friendId: string | undefined;
  handleMarkAsRead: (notificationId: string) => void;
  handleRemoveNotification: (notificationId: string) => void;
  handleViewProfile: (notification: any) => void;
  handleAccept: (e: React.MouseEvent, friendId: string) => void;
  handleReject: (e: React.MouseEvent, friendId: string) => void;
  handleRemoveFriendAction: (e: React.MouseEvent, friendId: string) => void;
  handleNotificationClick: (notification: any) => void;
  getIconClass: (type: string) => string;
  getSecondaryIconClass: (type: string) => string;
  t: (key: string) => string;
  isRemoving: boolean;
}

const NotificationItem = memo(
  ({
    notification,
    userId,
    isPending,
    isAccepted,
    friendId,
    handleMarkAsRead,
    handleRemoveNotification,
    handleViewProfile,
    handleAccept,
    handleReject,
    handleRemoveFriendAction,
    handleNotificationClick,
    getIconClass,
    getSecondaryIconClass,
    t,
    isRemoving,
  }: NotificationItemProps) => {
    useEffect(() => {
      console.log(`🔄 NotificationItem re-rendu pour ID: ${notification.id}`);
    }, [notification.id]);

    return (
      <div className={`notification-wrapper ${isRemoving ? "removing" : ""}`}>
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
                  handleMarkAsRead(notification.id);
                }}
                title={t("notification.markAsRead")}
              >
                <i className="fas fa-check-circle"></i>
              </button>
            )}
            {friendId && (
              <button
                className="view-profile-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProfile(notification);
                }}
                title={t("notification.viewProfile")}
              >
                <i className="fas fa-user"></i>
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
            {notification.type === "friend_request_received" && friendId && isPending && !isAccepted && (
              <div className="notification-actions">
                <button
                  className="accept-button"
                  onClick={(e) => handleAccept(e, friendId)}
                  title={t("notification.accept")}
                >
                  <i className="fas fa-check"></i>
                </button>
                <button
                  className="reject-button"
                  onClick={(e) => handleReject(e, friendId)}
                  title={t("notification.reject")}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            {notification.type === "friend_request_received" && friendId && isAccepted && (
              <button
                className="remove-friend-button"
                onClick={(e) => handleRemoveFriendAction(e, friendId)}
                title={t("notification.removeFriend")}
              >
                <i className="fas fa-user-minus"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.isRead === nextProps.notification.isRead &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.isAccepted === nextProps.isAccepted &&
    prevProps.isRemoving === nextProps.isRemoving &&
    prevProps.handleMarkAsRead === nextProps.handleMarkAsRead &&
    prevProps.handleRemoveNotification === nextProps.handleRemoveNotification &&
    prevProps.handleViewProfile === nextProps.handleViewProfile &&
    prevProps.handleAccept === nextProps.handleAccept &&
    prevProps.handleReject === nextProps.handleReject &&
    prevProps.handleRemoveFriendAction === nextProps.handleRemoveFriendAction &&
    prevProps.handleNotificationClick === nextProps.handleNotificationClick &&
    prevProps.getIconClass === nextProps.getIconClass &&
    prevProps.getSecondaryIconClass === nextProps.getSecondaryIconClass &&
    prevProps.t === nextProps.t
);

const NotificationDropdown = forwardRef<HTMLDivElement, NotificationDropdownProps>(
  ({ isOpen, onToggle, onClose }, ref) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { notifications, status, error } = useSelector((state: RootState) => state.notification);
    const { loadNotifications, handleMarkAsRead: markAsReadAsync, handleRemoveNotification: removeNotificationAsync, handleClearNotifications } = useNotificationActions(t);
    const { friends, receivedRequests, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend } = useFriendActions();
    const { user: currentUser } = useSelector((state: RootState) => state.user);
    const userId = localStorage.getItem("userId") || "";

    const [removingIds, setRemovingIds] = useState<string[]>([]);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [selectedMemberImages, setSelectedMemberImages] = useState<Image[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
      console.log("🔄 NotificationDropdown re-rendu");
      if (isInitialMount.current && isOpen) {
        console.log("🔍 Chargement initial des notifications pour userId:", userId);
        loadNotifications(userId); // Appel correct de loadNotifications depuis useNotificationActions
        isInitialMount.current = false;
      }
    }, [isOpen, loadNotifications, userId]);

    useEffect(() => {
      if (successMessage) {
        const timer = setTimeout(() => setSuccessMessage(null), 3000);
        return () => clearTimeout(timer);
      }
      if (errorMessage) {
        const timer = setTimeout(() => setErrorMessage(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [successMessage, errorMessage]);

    const unreadCount = notifications.filter((notif) => !notif.isRead).length;

    const handleViewProfile = useCallback(async (notification: any) => {
      const memberId = notification.data?.fromUserId || notification.data?.friendId || notification.data?.likerId;
      if (memberId) {
        try {
          const member = await dispatch(fetchUserById(memberId)).unwrap();
          setSelectedMember(member);
          if (member.id) {
            const imagesResult = await dispatch(getAllImagesByUserId(member.id)).unwrap();
            const sortedImages = [...imagesResult.images].sort((a: Image, b: Image) =>
              a.isProfilePicture && !b.isProfilePicture ? -1 : !a.isProfilePicture && b.isProfilePicture ? 1 : 0
            );
            setSelectedMemberImages(sortedImages);
          }
        } catch (err) {
          console.error("❌ Erreur lors de la récupération du membre:", err);
          setErrorMessage("Erreur lors de la récupération du profil");
        }
      }
      onClose();
    }, [dispatch, onClose]);

    const handleNotificationClick = useCallback(async (notification: any) => {
      switch (notification.type) {
        case "new_chat":
        case "new_private_message":
          navigate(`/chat/private/${notification.data?.chatId || "default"}`);
          break;
        case "new_group_message":
          navigate(`/chat/group/${notification.data?.groupId || "default"}`);
          break;
        default:
          break;
      }
      handleMarkAsRead(notification.id);
      onClose();
    }, [navigate, onClose]);

    const handleAccept = useCallback((e: React.MouseEvent, friendId: string) => {
      e.stopPropagation();
      handleAcceptFriendRequest(friendId, (errorMessage) => {
        if (errorMessage) {
          setErrorMessage(errorMessage);
        } else {
          setSuccessMessage(t("notification.accept"));
        }
      });
    }, [handleAcceptFriendRequest, t]);

    const handleReject = useCallback((e: React.MouseEvent, friendId: string) => {
      e.stopPropagation();
      handleRejectFriendRequest(friendId, (errorMessage) => {
        if (errorMessage) {
          setErrorMessage(errorMessage);
        } else {
          setSuccessMessage(t("notification.reject"));
        }
      });
    }, [handleRejectFriendRequest, t]);

    const handleRemoveFriendAction = useCallback((e: React.MouseEvent, friendId: string) => {
      e.stopPropagation();
      handleRemoveFriend(friendId, (errorMessage) => {
        if (errorMessage) {
          setErrorMessage(errorMessage);
        } else {
          setSuccessMessage(t("notification.removeFriend"));
        }
      });
    }, [handleRemoveFriend, t]);

    const handleMarkAsRead = useCallback((notificationId: string) => {
      console.log("📌 Marquage comme lu:", notificationId);
      markAsReadAsync(notificationId).catch((err) =>
        console.error("❌ Échec du marquage comme lu:", err)
      );
    }, [markAsReadAsync]);

    const handleRemoveNotification = useCallback((notificationId: string) => {
      console.log("🗑️ Suppression de la notification:", notificationId);
      setRemovingIds((prev) => [...prev, notificationId]);
      removeNotificationAsync(notificationId)
        .then(() => {
          console.log("✅ Suppression serveur confirmée:", notificationId);
          setSuccessMessage(t("notification.remove"));
        })
        .catch((err) => {
          console.error("❌ Échec de la suppression côté serveur:", err);
          setErrorMessage("Erreur lors de la suppression de la notification");
        })
        .finally(() => setRemovingIds((prev) => prev.filter((id) => id !== notificationId)));
    }, [removeNotificationAsync, t]);

    const isFriendRequestPending = useCallback((friendId: string) =>
      receivedRequests.some((request) => request.id === friendId), [receivedRequests]);

    const isFriendRequestAccepted = useCallback((friendId: string) =>
      friends.some((friend) => friend.id === friendId), [friends]);

    const getIconClass = useCallback((type: string) => {
      switch (type) {
        case "new_chat": case "new_private_message": case "new_group_message": return "fas fa-envelope";
        case "friend_request_received": return "fas fa-user-plus";
        case "friend_request_accepted": return "fas fa-user-check";
        case "friend_request_rejected": return "fas fa-user-times";
        case "friend_removed": return "fas fa-user-slash";
        case "user_like": return "fas fa-thumbs-up";
        case "user_unlike": return "fas fa-thumbs-down";
        default: return "fas fa-info";
      }
    }, []);

    const getSecondaryIconClass = useCallback((type: string) => {
      switch (type) {
        case "friend_request_received": case "friend_request_accepted": case "friend_request_rejected":
        case "friend_removed": case "user_like": case "user_unlike": return "fas fa-bell";
        case "new_chat": case "new_private_message": case "new_group_message": return "fas fa-comment-dots";
        default: return "fas fa-info-circle";
      }
    }, []);

    const closeModal = useCallback(() => {
      setSelectedMember(null);
      setSelectedMemberImages([]);
    }, []);

    const handleEditProfile = useCallback(() => {
      closeModal();
      navigate("/edit-profile");
    }, [closeModal, navigate]);

    const formatValue = useCallback((value: string | number | undefined | string[]): string =>
      Array.isArray(value) ? (value.length > 0 ? value.join(", ") : "Aucun") : value?.toString() || "Non renseigné", []);

    if (status === "loading") {
      return <div className="notification-loading">{t("notification.loading")}</div>;
    }
    if (status === "failed") {
      return (
        <div className="notification-error">
          {t("notification.error")} {error}
          <button onClick={() => loadNotifications(userId)}>
            Réessayer
          </button>
        </div>
      );
    }

    return (
      <div className="navbar-notifications" ref={ref}>
        <button
          className={`nav-item ${unreadCount > 0 ? "has-unread" : ""}`}
          onClick={onToggle}
          title={t("navbar.notifications")}
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        </button>
        <div className={`dropdown-menu ${isOpen ? "active" : ""}`}>
          {successMessage && <p className="success-message">{successMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button
            className="dropdown-item view-all-button"
            onClick={() => { navigate("/notifications"); onClose(); }}
          >
            <i className="fas fa-list"></i> {t("notification.viewAll")}
          </button>
          <div className="notification-divider"></div>
          {notifications.length === 0 ? (
            <div className="dropdown-item no-notifications">
              <div className="icon-group">
                <i className="fas fa-bell-slash"></i>
              </div>
              <span>{t("notification.noNotifications")}</span>
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => {
                const friendId = notification.data?.fromUserId || notification.data?.friendId || notification.data?.likerId;
                const isPending = notification.type === "friend_request_received" && friendId && isFriendRequestPending(friendId);
                const isAccepted = friendId && isFriendRequestAccepted(friendId);
                const isRemoving = removingIds.includes(notification.id);

                return (
                  <React.Fragment key={notification.id}>
                    {index > 0 && <div className="notification-divider"></div>}
                    <NotificationItem
                      notification={notification}
                      userId={userId}
                      isPending={isPending}
                      isAccepted={isAccepted}
                      friendId={friendId}
                      handleMarkAsRead={handleMarkAsRead}
                      handleRemoveNotification={handleRemoveNotification}
                      handleViewProfile={handleViewProfile}
                      handleAccept={handleAccept}
                      handleReject={handleReject}
                      handleRemoveFriendAction={handleRemoveFriendAction}
                      handleNotificationClick={handleNotificationClick}
                      getIconClass={getIconClass}
                      getSecondaryIconClass={getSecondaryIconClass}
                      t={t}
                      isRemoving={isRemoving}
                    />
                  </React.Fragment>
                );
              })}
              <div className="notification-divider"></div>
              <button
                className="dropdown-item clear-button"
                onClick={() => handleClearNotifications()}
              >
                <i className="fas fa-trash"></i> {t("navbar.clearNotifications")}
              </button>
            </>
          )}
        </div>
        {selectedMember && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{t("member.details")}</h2>
              <div className="modal-avatar">
                {selectedMemberImages.length > 0 ? (
                  <div className="modal-images">
                    {selectedMemberImages.map((img) => (
                      <img key={img.id} src={`http://localhost:7000/${img.path}`} alt={img.name} className="modal-image" />
                    ))}
                  </div>
                ) : (
                  <div className="modal-avatar-placeholder">
                    <i className="fas fa-user-circle"></i>
                  </div>
                )}
              </div>
              <p><strong>ID :</strong> {formatValue(selectedMember.id)}</p>
              <p><strong>Email :</strong> {formatValue(selectedMember.email)}</p>
              <p><strong>Prénom :</strong> {formatValue(selectedMember.firstName)}</p>
              <p><strong>Nom :</strong> {formatValue(selectedMember.lastName)}</p>
              <p><strong>Téléphone :</strong> {formatValue(selectedMember.phone)}</p>
              <p><strong>Adresse :</strong> {formatValue(selectedMember.address)}</p>
              <p><strong>Sexe :</strong> {formatValue(selectedMember.sex)}</p>
              <p><strong>Slug :</strong> {formatValue(selectedMember.slug)}</p>
              <p><strong>Bio :</strong> {formatValue(selectedMember.bio)}</p>
              <p><strong>Latitude :</strong> {formatValue(selectedMember.latitude)}</p>
              <p><strong>Longitude :</strong> {formatValue(selectedMember.longitude)}</p>
              <p><strong>Liké par :</strong> {formatValue(selectedMember.likerUserIds)}</p>
              <p><strong>A liké :</strong> {formatValue(selectedMember.likedUserIds)}</p>
              <p><strong>Image IDs :</strong> {formatValue(selectedMember.imageIds)}</p>
              <div className="modal-actions">
                {currentUser?.id === selectedMember.id && (
                  <button className="edit-profile-button" onClick={handleEditProfile}>
                    <i className="fas fa-edit"></i> {t("member.editProfile")}
                  </button>
                )}
                <button className="close-button" onClick={closeModal}>
                  <i className="fas fa-times"></i> {t("member.close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default memo(NotificationDropdown);