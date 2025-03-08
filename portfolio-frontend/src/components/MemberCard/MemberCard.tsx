import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { likeUser, unlikeUser, User } from "../../redux/features/userSlice";
import { fetchPrivateMessages } from "../../redux/features/chatSlice";
import { useNavigate } from "react-router-dom";
import { useFriendActions } from "../../hooks/useFriendActions";
import { getFriendButtonProps } from "../../utils/friendButtonUtils"; // Import externe
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
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
  } = useFriendActions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCurrentUser = currentUser?.id === member.id;
  const hasLiked = currentUser?.likedUserIds?.includes(member.id);
  const isFriend = friends.some((friend) => friend.id === member.id);
  const hasSentRequest = sentRequests.some((request) => request.id === member.id);
  const hasReceivedRequest = receivedRequests.some((request) => request.id === member.id);

  useEffect(() => {
    console.log(
      `🔍 État pour ${member.id} - isFriend: ${isFriend}, hasSentRequest: ${hasSentRequest}, hasReceivedRequest: ${hasReceivedRequest}`
    );
  }, [isFriend, hasSentRequest, hasReceivedRequest, member.id]);

  const isProfileIncomplete = useCallback(() => {
    const incomplete =
      !currentUser?.firstName ||
      !currentUser?.lastName ||
      currentUser.firstName.trim() === "" ||
      currentUser.lastName.trim() === "";
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

  const closeModal = useCallback(() => setIsModalOpen(false), []);

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

  const handleFriendAction = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isFriend) {
        handleRemoveFriend(member.id, (errorMessage) => alert(errorMessage));
      } else if (hasSentRequest) {
        handleCancelFriendRequest(member.id, (errorMessage) => alert(errorMessage));
      } else {
        handleSendFriendRequest(member.id, (errorMessage) => alert(errorMessage));
      }
    },
    [
      isFriend,
      hasSentRequest,
      member.id,
      handleRemoveFriend,
      handleCancelFriendRequest,
      handleSendFriendRequest,
    ]
  );

  const handleAccept = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleAcceptFriendRequest(member.id, (errorMessage) => alert(errorMessage));
    },
    [member.id, handleAcceptFriendRequest]
  );

  const handleReject = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleRejectFriendRequest(member.id, (errorMessage) => alert(errorMessage));
    },
    [member.id, handleRejectFriendRequest]
  );

  const buttonProps = getFriendButtonProps(member.id, isFriend, hasSentRequest, hasReceivedRequest);
  const cardKey = `${member.id}-${isFriend}-${hasSentRequest}-${hasReceivedRequest}`;

  return (
    <div key={cardKey} className={`member-card ${isModalOpen ? "modal-open" : ""}`} onClick={handleCardClick}>
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
          <button
            className="like-button"
            onClick={handleLikeToggle}
            title={hasLiked ? "Retirer le like" : "Liker"}
          >
            <i className={hasLiked ? "fas fa-heart" : "far fa-heart"}></i>
          </button>
          <button className="chat-button" onClick={handleChat} title="Chatter">
            <i className="fas fa-comment"></i>
          </button>
          <button
            className={buttonProps.className}
            onClick={handleFriendAction}
            title={buttonProps.title}
          >
            <i className={buttonProps.icon}></i>
            {buttonProps.text}
          </button>
          {hasReceivedRequest && (
            <>
              <button className="accept-button" onClick={handleAccept} title="Accepter la demande">
                <i className="fas fa-check"></i>
              </button>
              <button className="reject-button" onClick={handleReject} title="Refuser la demande">
                <i className="fas fa-times"></i>
              </button>
            </>
          )}
        </div>
      )}
      {isModalOpen && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content">
            <h2>Profil incomplet</h2>
            <p>Veuillez compléter votre profil avec un prénom et un nom pour tchatter.</p>
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