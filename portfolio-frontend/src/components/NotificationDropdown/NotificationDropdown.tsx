// src/components/NotificationDropdown.tsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../redux/store";
import { useNotificationActions } from "../../hooks/useNotificationActions";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
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

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onToggle, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { notifications, status, error, loadNotifications, handleMarkAsRead, handleRemoveNotification, handleClearNotifications } =
    useNotificationActions(t);
  const { friends, receivedRequests, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend } = useFriendActions();
  const { user: currentUser } = useSelector((state: RootState) => state.user);
  const userId = localStorage.getItem("userId") || "";

  const [refresh, setRefresh] = useState(false);
  const [noNotifications, setNoNotifications] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedMemberImages, setSelectedMemberImages] = useState<Image[]>([]);
  const isInitialMount = useRef(true);
  const lastFetchTimestamp = useRef<number | null>(null);

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

  const handleViewProfile = async (notification: any) => {
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
      }
    }
    onClose();
  };

  const handleNotificationClick = async (notification: any) => {
    switch (notification.type) {
      case "new_chat":
      case "new_private_message":
        navigate(`/chat/private/${notification.data?.chatId || "default"}`);
        break;
      case "new_group_message":
        navigate(`/chat/group/${notification.data?.groupId || "default"}`);
        break;
      default:
        // Par défaut, ne rien faire (la navigation est gérée par le bouton "Voir le profil")
        break;
    }
    handleMarkAsRead(notification.id, userId);
    loadNotifications(userId); // S'assurer que l'état est synchronisé après le clic
    onClose();
  };

  const handleToggle = () => {
    onToggle();
    if (!isOpen && unreadCount > 0) {
      // Optionnel : marquer toutes comme lues à l'ouverture
      // dispatch(markAllNotificationsAsRead());
    }
  };

  const handleViewAllNotifications = () => {
    navigate("/notifications");
    onClose();
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
      case "user_like":
        return "fas fa-thumbs-up";
      case "user_unlike":
        return "fas fa-thumbs-down";
      default:
        return "fas fa-info";
    }
  };

  const getSecondaryIconClass = (type: string) => {
    switch (type) {
      case "friend_request_received":
      case "friend_request_accepted":
      case "friend_request_rejected":
      case "friend_removed":
      case "user_like":
      case "user_unlike":
        return "fas fa-bell";
      case "new_chat":
      case "new_private_message":
      case "new_group_message":
        return "fas fa-comment-dots";
      default:
        return "fas fa-info-circle";
    }
  };

  const closeModal = () => {
    setSelectedMember(null);
    setSelectedMemberImages([]);
  };

  const handleEditProfile = () => {
    closeModal();
    navigate("/edit-profile");
  };

  const formatValue = (value: string | number | undefined | string[]): string =>
    Array.isArray(value) ? (value.length > 0 ? value.join(", ") : "Aucun") : value?.toString() || "Non renseigné";

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
        <button
          className="dropdown-item view-all-button"
          onClick={handleViewAllNotifications}
        >
          <i className="fas fa-list"></i> {t("notification.viewAll")}
        </button>
        <div className="notification-divider"></div>
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
              const friendId = notification.data?.fromUserId || notification.data?.friendId || notification.data?.likerId;
              const isPending = notification.type === "friend_request_received" && friendId && isFriendRequestPending(friendId);
              const isAccepted = friendId && isFriendRequestAccepted(friendId);

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
                          handleRemoveNotification(notification.id, userId);
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

      {selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t("member.details")}</h2>
            <div className="modal-avatar">
              {selectedMemberImages.length > 0 ? (
                <div className="modal-images">
                  {selectedMemberImages.map((img) => (
                    <img
                      key={img.id}
                      src={`http://localhost:7000/${img.path}`}
                      alt={img.name}
                      className="modal-image"
                    />
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
};

export default NotificationDropdown;