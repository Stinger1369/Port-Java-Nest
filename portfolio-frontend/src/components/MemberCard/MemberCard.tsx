import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { likeUser, unlikeUser, User } from "../../redux/features/userSlice";
import { fetchPrivateMessages } from "../../redux/features/chatSlice";
import { useNavigate } from "react-router-dom";
import { useFriendActions } from "../../redux/features/friendActions";
import "./MemberCard.css";

interface MemberCardProps {
  member: User;
  profileImage: string | null;
  onClick: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, profileImage, onClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const {
    friends,
    sentRequests,
    receivedRequests,
    handleSendFriendRequest,
    handleCancelFriendRequest,
    handleRemoveFriend,
  } = useFriendActions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log(`🔍 Rendu de MemberCard pour ${member.id}, profileImage: ${profileImage}`); // Log pour débogage

  const isCurrentUser = currentUser?.id === member.id;
  const hasLiked = currentUser?.likedUserIds?.includes(member.id);

  // Vérifier l'état de la relation avec le membre
  const isFriend = friends.some((friend) => friend.id === member.id);
  const hasSentRequest = sentRequests.some((request) => request.id === member.id);
  const hasReceivedRequest = receivedRequests.some((request) => request.id === member.id);

  const isProfileIncomplete = useCallback(() => {
    const incomplete =
      !currentUser?.firstName ||
      !currentUser?.lastName ||
      currentUser.firstName.trim() === "" ||
      currentUser.lastName.trim() === "";
    console.log(
      `🔍 Profil incomplet ? firstName: ${currentUser?.firstName}, lastName: ${currentUser?.lastName}, Résultat:`,
      incomplete
    );
    return incomplete;
  }, [currentUser]);

  const handleLikeToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUser || isCurrentUser) return;

      if (hasLiked) {
        dispatch(unlikeUser({ likerId: currentUser.id, likedId: member.id }));
      } else {
        dispatch(likeUser({ likerId: currentUser.id, likedId: member.id }));
      }
    },
    [currentUser, isCurrentUser, hasLiked, dispatch, member.id]
  );

  const handleChat = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!currentUser || isCurrentUser) return;

      if (isProfileIncomplete()) {
        setIsModalOpen(true);
      } else {
        dispatch(fetchPrivateMessages(member.id));
        navigate(`/chat/private/${member.id}`);
      }
    },
    [currentUser, isCurrentUser, isProfileIncomplete, dispatch, member.id, navigate]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCompleteProfile = useCallback(() => {
    closeModal();
    navigate("/edit-profile");
  }, [closeModal, navigate]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target instanceof HTMLElement) || !e.target.closest(".like-container")) {
        onClick();
      }
    },
    [onClick]
  );

  const handleFriendAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFriend) {
      handleRemoveFriend(member.id);
    } else if (hasSentRequest) {
      handleCancelFriendRequest(member.id);
    } else {
      handleSendFriendRequest(member.id, (errorMessage) => {
        alert(errorMessage || "Une erreur s'est produite.");
      });
    }
  };

  const getFriendButtonProps = () => {
    if (isFriend) {
      return {
        className: "friend-remove-button",
        icon: "fas fa-trash-alt",
      };
    } else if (hasSentRequest) {
      return {
        className: "friend-pending-button",
        icon: "fas fa-hourglass-half",
        cancelIcon: "fas fa-times",
      };
    } else {
      return {
        className: "friend-request-button",
        icon: "fas fa-user-plus",
      };
    }
  };

  const buttonProps = getFriendButtonProps();

  return (
    <div className={`member-card ${isModalOpen ? "modal-open" : ""}`} onClick={handleCardClick}>
      <div className="member-header">
        <div className="member-avatar">
          {profileImage ? (
            <img
              src={`http://localhost:7000/${profileImage}`}
              alt="Profile"
              className="member-avatar-img"
            />
          ) : (
            <div className="member-avatar-placeholder">
              <i className="fas fa-user-circle"></i>
            </div>
          )}
        </div>
        <h3>
          {member.firstName || "Non défini"} {member.lastName || "Non défini"}
        </h3>
        <p className="email">{member.email}</p>
      </div>
      <div className="member-details">
        {member.phone && (
          <p>
            <i className="fas fa-phone"></i> {member.phone}
          </p>
        )}
        {member.slug && (
          <p>
            <i className="fas fa-link"></i>
            <a
              href={`/portfolio/${member.firstName}/${member.lastName}/${member.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir le portfolio
            </a>
          </p>
        )}
      </div>
      {!isCurrentUser && (
        <div className="like-container">
          <button className="like-button" onClick={handleLikeToggle}>
            <i className={hasLiked ? "fas fa-heart" : "far fa-heart"}></i>
          </button>
          <button className="chat-button" onClick={handleChat}>
            <i className="fas fa-comment"></i>
          </button>
          <div className="friend-action-container">
            <button className={buttonProps.className} onClick={handleFriendAction}>
              <i className={buttonProps.icon}></i>
            </button>
            {hasSentRequest && (
              <button className="friend-cancel-button" onClick={handleFriendAction}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content">
            <h2>Profil incomplet</h2>
            <p>
              Veuillez compléter votre profil avec un prénom et un nom pour pouvoir tchatter avec les membres.
            </p>
            <div className="modal-actions">
              <button className="complete-profile-btn" onClick={handleCompleteProfile}>
                Compléter mon profil
              </button>
              <button className="close-modal-btn" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberCard;