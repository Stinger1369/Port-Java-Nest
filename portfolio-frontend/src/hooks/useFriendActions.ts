import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  cancelFriendRequest,
  fetchFriends,
  fetchSentFriendRequests,
  fetchReceivedFriendRequests,
} from "../redux/features/friendSlice";

export const useFriendActions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const { friends, sentRequests, receivedRequests, status, error, message } = useSelector(
    (state: RootState) => state.friend
  );

  const loadFriends = () => {
    if (user?.id && status !== "loading") {
      dispatch(fetchFriends(user.id))
        .unwrap()
        .catch((err) => console.error("❌ Erreur lors du chargement des amis:", err));
    }
  };

  const loadSentFriendRequests = () => {
    if (user?.id && status !== "loading") {
      dispatch(fetchSentFriendRequests(user.id))
        .unwrap()
        .catch((err) =>
          console.error("❌ Erreur lors du chargement des demandes envoyées:", err)
        );
    }
  };

  const loadReceivedFriendRequests = () => {
    if (user?.id && status !== "loading") {
      dispatch(fetchReceivedFriendRequests(user.id))
        .unwrap()
        .then(() => {
          console.log("✅ Demandes d'amis reçues chargées.");
        })
        .catch((err) =>
          console.error("❌ Erreur lors du chargement des demandes reçues:", err)
        );
    }
  };

  const handleSendFriendRequest = (receiverId: string, onError?: (message: string) => void) => {
    if (user?.id) {
      dispatch(sendFriendRequest({ senderId: user.id, receiverId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami envoyée avec succès !");
          // Pas de fetch ici, WebSocket mettra à jour sentRequests
        })
        .catch((err) => {
          console.error("❌ Erreur lors de l'envoi de la demande d'ami:", err);
          if (onError && typeof err === "string") {
            onError(err);
          } else if (onError) {
            onError("Une erreur s'est produite lors de l'envoi de la demande.");
          }
        });
    }
  };

  const handleAcceptFriendRequest = (friendId: string, onError?: (message: string) => void) => {
    if (user?.id) {
      dispatch(acceptFriendRequest({ userId: user.id, friendId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami acceptée avec succès !");
          // Pas de fetch ici, WebSocket mettra à jour friends et receivedRequests
        })
        .catch((err) => {
          console.error("❌ Erreur lors de l'acceptation de la demande d'ami:", err);
          if (onError && typeof err === "string") {
            onError(err);
          } else if (onError) {
            onError("Une erreur s'est produite lors de l'acceptation de la demande.");
          }
        });
    }
  };

  const handleRejectFriendRequest = (friendId: string, onError?: (message: string) => void) => {
    if (user?.id) {
      dispatch(rejectFriendRequest({ userId: user.id, friendId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami refusée avec succès !");
          // Pas de fetch ici, WebSocket mettra à jour receivedRequests
        })
        .catch((err) => {
          console.error("❌ Erreur lors du refus de la demande d'ami:", err);
          if (onError && typeof err === "string") {
            onError(err);
          } else if (onError) {
            onError("Une erreur s'est produite lors du refus de la demande.");
          }
        });
    }
  };

  const handleRemoveFriend = (friendId: string, onError?: (message: string) => void) => {
    if (user?.id) {
      dispatch(removeFriend({ userId: user.id, friendId }))
        .unwrap()
        .then(() => {
          console.log("✅ Ami supprimé avec succès !");
          // Pas de fetch ici, WebSocket mettra à jour friends
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de l'ami:", err);
          if (onError && typeof err === "string") {
            onError(err);
          } else if (onError) {
            onError("Une erreur s'est produite lors de la suppression de l'ami.");
          }
        });
    }
  };

  const handleCancelFriendRequest = (receiverId: string, onError?: (message: string) => void) => {
    if (user?.id) {
      dispatch(cancelFriendRequest({ senderId: user.id, receiverId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami annulée avec succès !");
          // Pas de fetch ici, WebSocket mettra à jour sentRequests
        })
        .catch((err) => {
          console.error("❌ Erreur lors de l'annulation de la demande d'ami:", err);
          if (onError && typeof err === "string") {
            onError(err);
          } else if (onError) {
            onError("Une erreur s'est produite lors de l'annulation de la demande.");
          }
        });
    }
  };

  return {
    friends,
    sentRequests,
    receivedRequests,
    status,
    error,
    message,
    loadFriends,
    loadSentFriendRequests,
    loadReceivedFriendRequests,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleRemoveFriend,
    handleCancelFriendRequest,
  };
};