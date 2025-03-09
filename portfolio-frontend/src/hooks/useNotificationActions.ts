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
  const { notifications, status, error } = useSelector(
    (state: RootState) => state.notification
  );
  const { handleAcceptFriendRequest, handleRejectFriendRequest } = useFriendActions();
  const userId = localStorage.getItem("userId") || "";

  const loadNotifications = (userId: string) => {
    console.log(
      "🔍 Tentative de chargement des notifications pour userId:",
      userId,
      "Statut actuel:",
      status,
      "Notifications existantes:",
      notifications.length,
      "No Notifications:",
      notifications.length === 0
    );
    if (status !== "loading" && status !== "succeeded") {
      dispatch(fetchNotifications(userId))
        .unwrap()
        .then((data) => {
          console.log("✅ Notifications chargées avec succès:", data);
        })
        .catch((err) => {
          console.error("❌ Erreur lors du chargement des notifications:", err);
          if (err.message.includes("Failed to fetch") || err.code === "ECONNREFUSED") {
            dispatch({ type: "notification/resetStatus" });
          }
        });
    } else {
      console.log("ℹ️ Chargement des notifications ignoré: déjà chargé ou en cours.");
    }
  };

  const handleMarkAsRead = (notificationId: string, userId: string) => {
    const notificationExists = notifications.some((notif) => notif.id === notificationId);

    if (!notificationExists) {
      console.warn("⚠️ Notification non trouvée dans l'état local:", notificationId);
      return;
    }

    // Vérifier si la notification est locale (non persistante côté serveur)
    const isLocalId = !notificationId.includes("-"); // Les ID locaux générés par uuid contiennent des tirets

    if (isLocalId) {
      // Marquer localement et recharger les notifications pour synchroniser
      dispatch(markAsRead(notificationId));
      console.log("✅ Notification locale marquée comme lue côté client:", notificationId);
      loadNotifications(userId); // Recharge pour synchroniser avec le serveur
    } else {
      // Marquer côté serveur
      dispatch(markNotificationAsRead({ notificationId, userId }))
        .unwrap()
        .then(() => {
          console.log("✅ Notification marquée comme lue:", notificationId);
          dispatch(markAsRead(notificationId)); // S'assurer que l'état local est synchronisé
        })
        .catch((err) => {
          console.error("❌ Erreur lors du marquage de la notification:", err);
          if (err === "Invalid argument: Notification introuvable") {
            dispatch(markAsRead(notificationId));
            console.log("ℹ️ Notification introuvable côté serveur, marquée localement:", notificationId);
          }
          loadNotifications(userId); // Recharge pour synchroniser
        });
    }
  };

  const handleRemoveNotification = (notificationId: string, userId: string) => {
    const isLocalId = !notificationId.includes("-");
    const notificationExists = notifications.some((notif) => notif.id === notificationId);

    if (isLocalId && notificationExists) {
      dispatch(removeNotification(notificationId));
      console.log("✅ Notification locale supprimée côté client:", notificationId);
      loadNotifications(userId);
    } else if (notificationExists) {
      dispatch(deleteNotification({ notificationId, userId }))
        .unwrap()
        .then(() => {
          console.log("✅ Notification supprimée du serveur:", notificationId);
          loadNotifications(userId);
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de la notification:", err);
          dispatch(removeNotification(notificationId));
          console.log("ℹ️ Notification supprimée localement en cas d'échec serveur:", notificationId);
          loadNotifications(userId);
        });
    } else {
      console.warn("⚠️ Notification non trouvée dans l'état local:", notificationId);
    }
  };

  const handleClearNotifications = (userId: string) => {
    const confirmMessage = t ? t("notification.confirmClear") : "Voulez-vous effacer toutes les notifications ?";
    if (window.confirm(confirmMessage)) {
      dispatch(clearAllNotifications(userId))
        .unwrap()
        .then(() => {
          console.log("✅ Toutes les notifications supprimées avec succès");
          loadNotifications(userId);
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression des notifications:", err);
          dispatch(clearNotifications());
          loadNotifications(userId);
        });
    }
  };

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
    loadNotifications,
    handleMarkAsRead,
    handleRemoveNotification: (notificationId: string) => handleRemoveNotification(notificationId, userId),
    handleClearNotifications,
    handleNotificationAction,
  };
};