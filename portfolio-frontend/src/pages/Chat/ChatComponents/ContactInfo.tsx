// portfolio-frontend/src/pages/Chat/ChatComponents/ContactInfo.tsx
import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "@reduxjs/toolkit"; // Importer createSelector
import Modal from "react-modal";
import { RootState, AppDispatch } from "../../../redux/store";
import MemberCard from "../../../components/MemberCard/MemberCard";
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
  selectedChatId: string | null;
}

// Sélecteur mémoïsé pour obtenir le membre
const selectMemberById = createSelector(
  (state: RootState) => state.user.members,
  (_: RootState, userId: string) => userId,
  (members, userId) => members.find((m) => m.id === userId)
);

// Sélecteur mémoïsé pour obtenir les images filtrées
const selectImagesByUserId = createSelector(
  (state: RootState) => state.image.images,
  (_: RootState, userId: string) => userId,
  (images, userId) => images.filter((img) => img.userId === userId)
);

// Sélecteur mémoïsé pour obtenir l'image de profil
const selectProfileImage = createSelector(
  selectImagesByUserId,
  (images) => images.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) || images[0] || null
);

const ContactInfo: React.FC<ContactInfoProps> = ({ userId, isOpen, onClose, selectedChatId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Utiliser les sélecteurs mémoïsés
  const member = useSelector((state: RootState) => selectMemberById(state, userId));
  const images = useSelector((state: RootState) => selectImagesByUserId(state, userId));
  const profileImage = useSelector((state: RootState) => selectProfileImage(state, userId));

  const currentUserId = useSelector((state: RootState) => state.auth.userId);
  const { friends, sentRequests, receivedRequests, handleRemoveFriend, handleSendFriendRequest } = useFriendActions();
  const isFriend = friends.some((friend) => friend.id === userId);
  const hasSentRequest = sentRequests.some((request) => request.id === userId);
  const hasReceivedRequest = receivedRequests.some((request) => request.id === userId);

  const handleCardClick = () => {
    // Pas d'action nécessaire dans le modal
  };

  const handleChat = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedChatId && (selectedChatId.startsWith(`temp-${userId}`) || selectedChatId === userId)) {
        onClose();
      } else if (currentUserId) {
        dispatch(fetchPrivateMessages(userId));
        navigate(`/chat/private/${userId}`);
        onClose();
      }
    },
    [dispatch, navigate, userId, currentUserId, selectedChatId, onClose]
  );

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

  const memberCardProps = {
    member,
    profileImage: profileImage ? profileImage.path : null,
    onClick: handleCardClick,
    disableChat: !!selectedChatId && (selectedChatId.startsWith(`temp-${userId}`) || selectedChatId === userId),
    disableLike: true,
    friendActionText: isFriend ? "Supprimer un ami" : "Ajouter un ami",
    onFriendAction: handleFriendAction,
    hideReceivedRequests: true,
    onChat: handleChat,
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
        <button className="ci-button" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  );
};

export default ContactInfo;