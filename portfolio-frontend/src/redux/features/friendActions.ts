import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  cancelFriendRequest,
  fetchFriends,
  fetchSentFriendRequests,
  fetchReceivedFriendRequests,
} from "./friendSlice";

// Hook personnalisé pour gérer toutes les actions liées aux amis
export const useFriendActions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const { friends, sentRequests, receivedRequests, status, error, message } = useSelector(
    (state: RootState) => state.friend
  );

  // Charger la liste des amis
  const loadFriends = () => {
    if (user?.id && status !== "loading" && friends.length === 0) {
      dispatch(fetchFriends(user.id))
        .unwrap()
        .catch((err) => console.error("❌ Erreur lors du chargement des amis:", err));
    }
  };

  // Charger les demandes d'amis envoyées
  const loadSentFriendRequests = () => {
    if (user?.id && status !== "loading" && sentRequests.length === 0) {
      dispatch(fetchSentFriendRequests(user.id))
        .unwrap()
        .catch((err) =>
          console.error("❌ Erreur lors du chargement des demandes envoyées:", err)
        );
    }
  };

  // Charger les demandes d'amis reçues (avec flag pour éviter les appels multiples)
  const loadReceivedFriendRequests = () => {
    if (user?.id && status !== "loading" && receivedRequests.length === 0 && !loadReceivedFriendRequests.called) {
      loadReceivedFriendRequests.called = true;
      dispatch(fetchReceivedFriendRequests(user.id))
        .unwrap()
        .then(() => {
          console.log("✅ Demandes d'amis reçues chargées une seule fois.");
        })
        .catch((err) =>
          console.error("❌ Erreur lors du chargement des demandes reçues:", err)
        );
    }
  };

  // Initialiser le flag statique
  if (typeof loadReceivedFriendRequests.called === "undefined") {
    loadReceivedFriendRequests.called = false;
  }

  // Envoyer une demande d'ami avec gestion d'erreur utilisateur
  const handleSendFriendRequest = (receiverId: string, onError?: (message: string) => void) => {
    if (user?.id) {
      dispatch(sendFriendRequest({ senderId: user.id, receiverId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami envoyée avec succès !");
          loadSentFriendRequests(); // Rafraîchir les demandes envoyées
        })
        .catch((err) => {
          console.error("❌ Erreur lors de l'envoi de la demande d'ami:", err);
          if (onError && typeof err === "object" && "error" in err) {
            onError(err.error || "Une erreur s'est produite.");
          } else if (onError) {
            onError("Une erreur s'est produite lors de l'envoi de la demande.");
          }
        });
    }
  };

  // Accepter une demande d'ami
  const handleAcceptFriendRequest = (friendId: string) => {
    if (user?.id) {
      dispatch(acceptFriendRequest({ userId: user.id, friendId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami acceptée avec succès !");
          loadFriends(); // Rafraîchir les amis
          loadReceivedFriendRequests(); // Rafraîchir les demandes reçues
        })
        .catch((err) => console.error("❌ Erreur lors de l'acceptation de la demande d'ami:", err));
    }
  };

  // Refuser une demande d'ami
  const handleRejectFriendRequest = (friendId: string) => {
    if (user?.id) {
      dispatch(rejectFriendRequest({ userId: user.id, friendId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami refusée avec succès !");
          loadReceivedFriendRequests(); // Rafraîchir les demandes reçues
        })
        .catch((err) => console.error("❌ Erreur lors du refus de la demande d'ami:", err));
    }
  };

  // Supprimer un ami
  const handleRemoveFriend = (friendId: string) => {
    if (user?.id) {
      dispatch(removeFriend({ userId: user.id, friendId }))
        .unwrap()
        .then(() => {
          console.log("✅ Ami supprimé avec succès !");
          loadFriends(); // Rafraîchir la liste des amis
        })
        .catch((err) => console.error("❌ Erreur lors de la suppression de l'ami:", err));
    }
  };

  // Annuler une demande d'ami envoyée
  const handleCancelFriendRequest = (receiverId: string) => {
    if (user?.id) {
      dispatch(cancelFriendRequest({ senderId: user.id, receiverId }))
        .unwrap()
        .then(() => {
          console.log("✅ Demande d'ami annulée avec succès !");
          loadSentFriendRequests(); // Rafraîchir les demandes envoyées
        })
        .catch((err) => console.error("❌ Erreur lors de l'annulation de la demande d'ami:", err));
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