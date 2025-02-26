import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchAllUsers, fetchUserById, User } from "../../../redux/features/userSlice";
import { useNavigate } from "react-router-dom"; // Ajout pour navigation
import MemberCard from "../../../components/MemberCard/MemberCard";
import "./MembersList.css";

const MembersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate(); // Ajouté pour redirection
  const { user, members, status, error } = useSelector((state: RootState) => state.user);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const openModal = async (member: User) => {
    setSelectedMember(member);
    await dispatch(fetchUserById(member.id)); // Charger les données complètes
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  const handleEditProfile = () => {
    navigate("/edit-profile"); // Rediriger vers EditProfile
  };

  const formatValue = (value: string | number | undefined) => value || "Non renseigné";

  const getUpdatedMember = () => {
    if (!selectedMember) return null;
    return members.find((m) => m.id === selectedMember.id) || selectedMember;
  };

  const displayedMember = getUpdatedMember();
  const currentUserId = user?.id || localStorage.getItem("userId"); // ID de l'utilisateur connecté
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
          <MemberCard key={member.id} member={member} onClick={() => openModal(member)} />
        ))}
      </div>

      {displayedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Détails du membre</h2>
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