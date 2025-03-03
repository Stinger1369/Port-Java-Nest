import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchAllUsers, fetchUserById, User } from "../../../redux/features/userSlice";
import { getAllImagesByUserId } from "../../../redux/features/imageSlice";
import { useNavigate } from "react-router-dom";
import MemberCard from "../../../components/MemberCard/MemberCard";
import "./MembersList.css";

const MembersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, members, status, error } = useSelector((state: RootState) => state.user);
  const { images } = useSelector((state: RootState) => state.image);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  useEffect(() => {
    dispatch(fetchAllUsers()).then((result) => {
      if (result.meta.requestStatus === "fulfilled" && result.payload) {
        // Récupérer les images pour chaque utilisateur
        result.payload.forEach((member: User) => {
          dispatch(getAllImagesByUserId(member.id)).then((imageResult) => {
            console.log(`🔍 Images récupérées pour l'utilisateur ${member.id}:`, imageResult.payload);
          });
        });
      }
    });
  }, [dispatch]);

  useEffect(() => {
    // Vérifier les images dans le state après chaque mise à jour
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
      const profileImg = userImages.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) || userImages[0];
      return profileImg.path;
    }
    return null;
  };

  const displayedMember = getUpdatedMember();
  const currentUserId = user?.id || localStorage.getItem("userId");
  const isCurrentUser = displayedMember && currentUserId === displayedMember.id;

  if (status === "loading") {
    return <p className="loading">⏳ Chargement des membres...</p>;
  }

  if (error) {
    return <p className="error-message">❌ Erreur : {error}</p>;
  }

  if (members.length === 0) {
    return (
      <div className="members-list-container">
        <h1>Liste des membres</h1>
        <p>Aucun membre trouvé.</p>
      </div>
    );
  }

  return (
    <div className="members-list-container">
      <h1>Liste des membres</h1>
      <div className="members-grid">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            profileImage={getProfileImage(member.id)}
            onClick={() => openModal(member)}
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