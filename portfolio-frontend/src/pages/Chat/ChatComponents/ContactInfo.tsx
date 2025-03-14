// portfolio-frontend/src/pages/Chat/ChatComponents/ContactInfo.tsx
import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "react-modal";
import { RootState, AppDispatch } from "../../../redux/store";
import MemberCard from "../../../components/MemberCard/MemberCard"; // Import de MemberCard
import { fetchPrivateMessages } from "../../../redux/features/chatSlice";
import { useNavigate } from "react-router-dom";
import { useFriendActions } from "../../../hooks/useFriendActions";
import "./ContactInfo.css";

// Définir l'élément racine pour l'accessibilité du modal
Modal.setAppElement("#root");

interface ContactInfoProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedChatId: string | null; // Ajout pour vérifier si dans le chat
}

const ContactInfo: React.FC<ContactInfoProps> = ({ userId, isOpen, onClose, selectedChatId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const member = useSelector((state: RootState) => state.user.members.find((m) => m.id === userId));
  const images = useSelector((state: RootState) => state.image.images.filter((img) => img.userId === userId));
  const profileImage = images.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) || images[0] || null;
  const currentUserId = useSelector((state: RootState) => state.auth.userId);
  const { friends, sentRequests, receivedRequests, handleRemoveFriend, handleSendFriendRequest } = useFriendActions();
  const isFriend = friends.some((friend) => friend.id === userId);
  const hasSentRequest = sentRequests.some((request) => request.id === userId);
  const hasReceivedRequest = receivedRequests.some((request) => request.id === userId);

  // Gestion du clic sur la carte (peut être vide ou utilisé pour une action spécifique)
  const handleCardClick = () => {
    // Pas d'action nécessaire dans le modal, mais on peut garder la prop pour compatibilité
  };

  // Gestion du clic sur "Chatter"
  const handleChat = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedChatId && (selectedChatId.startsWith(`temp-${userId}`) || selectedChatId === userId)) {
        // Si déjà dans le chat avec cet utilisateur, ferme le modal et retourne à la conversation
        onClose();
      } else if (currentUserId) {
        dispatch(fetchPrivateMessages(userId));
        navigate(`/chat/private/${userId}`);
        onClose(); // Ferme le modal après navigation
      }
    },
    [dispatch, navigate, userId, currentUserId, selectedChatId, onClose]
  );

  // Gestion de l'action d'ami
  const handleFriendAction = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUserId) return;

      if (isFriend) {
        handleRemoveFriend(userId, (errorMessage) => {
          if (errorMessage) {
            console.error("Erreur suppression ami:", errorMessage);
          } else {
            console.log("Ami supprimé avec succès");
          }
        });
      } else if (!hasSentRequest && !hasReceivedRequest) {
        handleSendFriendRequest(userId, (errorMessage) => {
          if (errorMessage) {
            console.error("Erreur envoi demande:", errorMessage);
          } else {
            console.log("Demande d’ami envoyée");
          }
        });
      }
    },
    [currentUserId, isFriend, hasSentRequest, hasReceivedRequest, userId, handleRemoveFriend, handleSendFriendRequest]
  );

  // Props personnalisées pour MemberCard dans le contexte du modal
  const memberCardProps = {
    member,
    profileImage: profileImage ? profileImage.path : null,
    onClick: handleCardClick,
    disableChat: !!selectedChatId && (selectedChatId.startsWith(`temp-${userId}`) || selectedChatId === userId), // Désactive "Chatter" si déjà dans le chat
    disableLike: true, // Désactive "Liker" dans le modal
    friendActionText: isFriend ? "Supprimer un ami" : "Ajouter un ami", // Affiche "Supprimer" si déjà amis
    onFriendAction: handleFriendAction,
    hideReceivedRequests: true, // Masque les boutons d'acceptation/refus dans le modal
    onChat: handleChat, // Passe la fonction handleChat personnalisée
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="ci-modal"
      overlayClassName="ci-overlay"
      contentLabel="Informations du contact"
    >
      <div className="ci-container">
        <h2 className="ci-title">Informations du contact</h2>
        {member ? (
          <MemberCard {...memberCardProps} />
        ) : (
          <p className="ci-error">Utilisateur non trouvé</p>
        )}
        <button className="ci-button" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
};

export default ContactInfo;