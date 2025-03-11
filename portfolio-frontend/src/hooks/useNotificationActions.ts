// src/hooks/useNotificationActions.ts
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import {
  addNotification,
  markAsRead,
  removeNotification,
  clearNotifications,
  fetchNotifications,
  markNotificationAsRead,
  clearAllNotifications,
  deleteNotification,
} from "../redux/features/notificationSlice";
import { useFriendActions } from "./useFriendActions";
import { TFunction } from "i18next";

export const useNotificationActions = (t?: TFunction<"translation", undefined>) => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, status, error } = useSelector((state: RootState) => state.notification);
  const { handleAcceptFriendRequest, handleRejectFriendRequest } = useFriendActions();
  const userId = localStorage.getItem("userId") || "";

  // Charger les notifications uniquement si nécessaire
  const loadNotifications = (userId: string) => {
    if (status !== "loading" && status !== "succeeded") {
      return dispatch(fetchNotifications(userId))
        .unwrap()
        .then((data) => {
          console.log("✅ Notifications chargées avec succès:", data.length);
          return data;
        })
        .catch((err) => {
          console.error("❌ Erreur lors du chargement des notifications:", err);
          throw err; // Propager l'erreur pour gestion dans le composant
        });
    }
    return Promise.resolve(notifications); // Retourner les notifications existantes si déjà chargées
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = (notificationId: string, userId: string) => {
    const notificationExists = notifications.some((notif) => notif.id === notificationId);
    if (!notificationExists) {
      console.warn("⚠️ Notification non trouvée:", notificationId);
      return Promise.resolve();
    }

    const isLocalId = !notificationId.includes("-");
    if (isLocalId) {
      dispatch(markAsRead(notificationId));
      return Promise.resolve();
    }

    return dispatch(markNotificationAsRead({ notificationId, userId }))
      .unwrap()
      .then(() => {
        dispatch(markAsRead(notificationId));
      })
      .catch((err) => {
        console.error("❌ Erreur lors du marquage comme lue:", err);
        if (err === "Invalid argument: Notification introuvable") {
          dispatch(markAsRead(notificationId)); // Marquer localement si introuvable sur le serveur
        }
      });
  };

  // Supprimer une notification
  const handleRemoveNotification = (notificationId: string, userId: string) => {
    const notificationExists = notifications.some((notif) => notif.id === notificationId);
    if (!notificationExists) {
      console.warn("⚠️ Notification non trouvée:", notificationId);
      return Promise.resolve();
    }

    const isLocalId = !notificationId.includes("-");
    if (isLocalId) {
      dispatch(removeNotification(notificationId));
      return Promise.resolve();
    }

    return dispatch(deleteNotification({ notificationId, userId }))
      .unwrap()
      .then(() => {
        console.log("✅ Notification supprimée du serveur:", notificationId);
        // Pas de loadNotifications ici : l'état Redux est déjà mis à jour par deleteNotification.fulfilled
      })
      .catch((err) => {
        console.error("❌ Erreur lors de la suppression:", err);
        dispatch(removeNotification(notificationId)); // Suppression locale en cas d'échec
        // Pas de loadNotifications : la gestion locale dans le composant suffit
      });
  };

  // Supprimer toutes les notifications
  const handleClearNotifications = (userId: string) => {
    const confirmMessage = t ? t("notification.confirmClear") : "Voulez-vous effacer toutes les notifications ?";
    if (!window.confirm(confirmMessage)) {
      return Promise.resolve();
    }

    return dispatch(clearAllNotifications(userId))
      .unwrap()
      .then(() => {
        console.log("✅ Toutes les notifications supprimées avec succès");
        // Pas de loadNotifications : l'état est déjà vidé par clearAllNotifications.fulfilled
      })
      .catch((err) => {
        console.error("❌ Erreur lors de la suppression totale:", err);
        dispatch(clearNotifications()); // Vidage local en cas d'échec
        // Pas de loadNotifications : gestion locale dans le composant
      });
  };

  // Gérer les actions spécifiques aux notifications
  const handleNotificationAction = (notification: Notification) => {
    switch (notification.type) {
      case "friend_request_received":
        const friendId = notification.data?.requestId || notification.data?.fromUserId;
        if (friendId) {
          const confirmMessage = t
            ? t("notification.confirmFriendRequest", { message: notification.message })
            : `Voulez-vous accepter la demande d'ami de ${notification.message}?`;
          if (window.confirm(confirmMessage)) {
            handleAcceptFriendRequest(friendId);
          } else {
            handleRejectFriendRequest(friendId);
          }
          handleMarkAsRead(notification.id, notification.userId);
        }
        break;
      default:
        console.log("📩 Notification non actionable:", notification);
    }
  };

  return {
    notifications,
    status,
    error,
    loadNotifications: (userId: string) => loadNotifications(userId),
    handleMarkAsRead: (notificationId: string) => handleMarkAsRead(notificationId, userId),
    handleRemoveNotification: (notificationId: string) => handleRemoveNotification(notificationId, userId),
    handleClearNotifications: () => handleClearNotifications(userId),
    handleNotificationAction,
  };
};