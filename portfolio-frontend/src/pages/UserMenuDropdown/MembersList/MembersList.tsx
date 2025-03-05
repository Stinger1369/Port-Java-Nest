import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchAllUsers, fetchUserById, User } from "../../../redux/features/userSlice";
import { getAllImagesByUserId } from "../../../redux/features/imageSlice";
import { useNavigate } from "react-router-dom";
import MemberCard from "../../../components/MemberCard/MemberCard";
import { useWebSocket } from "../../Chat/useWebSocket";
import { logout } from "../../../redux/features/authSlice"; // Ajout de l'import pour déconnexion
import "./MembersList.css";
import {
  fetchPendingReceivedFriendRequests,
  fetchPendingSentFriendRequests,
  fetchFriends,
} from "../../../redux/features/friendRequestSlice";

const MembersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, members, status, error } = useSelector((state: RootState) => state.user);
  const { images } = useSelector((state: RootState) => state.image);
  const {
    pendingReceivedRequests,
    pendingSentRequests,
    friends,
    status: friendRequestStatus,
    error: friendRequestError,
  } = useSelector((state: RootState) => state.friendRequest);
  const token = useSelector((state: RootState) => state.auth.token);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Gestion du WebSocket avec détection d'échec d'authentification
  const { wsInstance } = useWebSocket(token);

  useEffect(() => {
    if (!token) {
      console.log("🔴 Aucun token disponible, redirection vers la connexion");
      dispatch(logout());
      navigate("/login");
      return;
    }

    dispatch(fetchAllUsers()).then((result) => {
      if (result.meta.requestStatus === "fulfilled" && result.payload) {
        result.payload.forEach((member: User) => {
          dispatch(getAllImagesByUserId(member.id)).then((imageResult) => {
            console.log(
              `🔍 Images récupérées pour l'utilisateur ${member.id}:`,
              imageResult.payload
            );
          });
        });
      }
    });

    if (user?.id) {
      dispatch(fetchPendingReceivedFriendRequests(user.id));
      dispatch(fetchPendingSentFriendRequests(user.id));
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user, token, navigate]);

  useEffect(() => {
    console.log("🔍 Toutes les images dans state.image.images:", images);
  }, [images]);

  const openModal = async (member: User) => {
    setSelectedMember(member);
    await dispatch(fetchUserById(member.id));
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const formatValue = (value: string | number | undefined | string[]) => {
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Aucun";
    return value || "Non renseigné";
  };

  const getUpdatedMember = () => {
    if (!selectedMember) return null;
    return members.find((m) => m.id === selectedMember.id) || selectedMember;
  };

  const getProfileImage = (userId: string) => {
    const userImages = images.filter((img) => img.userId === userId);
    if (userImages.length > 0) {
      const profileImg =
        userImages.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) ||
        userImages[0];
      return profileImg.path;
    }
    return null;
  };

  const filteredMembers = members.filter((member) => {
    const hasFirstName = member.firstName && member.firstName.trim() !== "";
    const hasLastName = member.lastName && member.lastName.trim() !== "";
    return hasFirstName && hasLastName;
  });

  const displayedMember = getUpdatedMember();
  const currentUserId = user?.id || localStorage.getItem("userId");
  const isCurrentUser = displayedMember && currentUserId === displayedMember.id;

  if (status === "loading" || friendRequestStatus === "loading") {
    return <p className="loading">⏳ Chargement des membres...</p>;
  }

  if (error || friendRequestError) {
    return <p className="error-message">❌ Erreur : {error || friendRequestError}</p>;
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="members-list-container">
        <h1>Liste des membres</h1>
        <p>Aucun membre avec un profil complet trouvé.</p>
      </div>
    );
  }

  return (
    <div className="members-list-container">
      <h1>Liste des membres</h1>
      <div className="members-grid">
        {filteredMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            profileImage={getProfileImage(member.id)}
            onClick={() => openModal(member)}
            pendingReceivedRequests={pendingReceivedRequests}
            pendingSentRequests={pendingSentRequests}
            friends={friends}
          />
        ))}
      </div>

      {displayedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Détails du membre</h2>
            <div className="modal-avatar">
              {getProfileImage(displayedMember.id) ? (
                <img
                  src={`http://localhost:7000/${getProfileImage(displayedMember.id)}`}
                  alt="Profile"
                  className="modal-avatar-img"
                />
              ) : (
                <div className="modal-avatar-placeholder">
                  <i className="fas fa-user-circle"></i>
                </div>
              )}
            </div>
            <p><strong>ID :</strong> {formatValue(displayedMember.id)}</p>
            <p><strong>Email :</strong> {formatValue(displayedMember.email)}</p>
            <p><strong>Prénom :</strong> {formatValue(displayedMember.firstName)}</p>
            <p><strong>Nom :</strong> {formatValue(displayedMember.lastName)}</p>
            <p><strong>Téléphone :</strong> {formatValue(displayedMember.phone)}</p>
            <p><strong>Adresse :</strong> {formatValue(displayedMember.address)}</p>
            <p><strong>Sexe :</strong> {formatValue(displayedMember.sex)}</p>
            <p><strong>Slug :</strong> {formatValue(displayedMember.slug)}</p>
            <p><strong>Bio :</strong> {formatValue(displayedMember.bio)}</p>
            <p><strong>Latitude :</strong> {formatValue(displayedMember.latitude)}</p>
            <p><strong>Longitude :</strong> {formatValue(displayedMember.longitude)}</p>
            <p><strong>Liké par :</strong> {formatValue(displayedMember.likerUserIds)}</p>
            <p><strong>A liké :</strong> {formatValue(displayedMember.likedUserIds)}</p>

            <div className="modal-actions">
              {isCurrentUser && (
                <button className="edit-profile-button" onClick={handleEditProfile}>
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              )}
              <button className="close-button" onClick={closeModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersList;