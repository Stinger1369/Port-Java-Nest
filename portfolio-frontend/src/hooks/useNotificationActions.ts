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
} from "../redux/features/notificationSlice";
import { useFriendActions } from "./useFriendActions";
import { TFunction } from "i18next";

export const useNotificationActions = (t?: TFunction<"translation", undefined>) => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, status, error } = useSelector(
    (state: RootState) => state.notification
  );
  const { handleAcceptFriendRequest, handleRejectFriendRequest } = useFriendActions();

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
    // Ne charger que si le statut n'est pas "loading" et que le chargement est nécessaire
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
    dispatch(markNotificationAsRead({ notificationId, userId }))
      .unwrap()
      .then(() => {
        console.log("✅ Notification marquée comme lue:", notificationId);
      })
      .catch((err) => console.error("❌ Erreur lors du marquage de la notification:", err));
  };

  const handleRemoveNotification = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  const handleClearNotifications = (userId: string) => {
    const confirmMessage = t ? t("notification.confirmClear") : "Voulez-vous effacer toutes les notifications ?";
    if (window.confirm(confirmMessage)) {
      dispatch(clearAllNotifications(userId))
        .unwrap()
        .then(() => {
          console.log("✅ Toutes les notifications supprimées avec succès");
          loadNotifications(userId); // Recharger une fois après suppression
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression des notifications:", err);
          dispatch(clearNotifications());
          loadNotifications(userId); // Réessayer une fois
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
    handleRemoveNotification,
    handleClearNotifications,
    handleNotificationAction,
  };
};