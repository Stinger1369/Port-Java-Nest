import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchAllUsers } from "../../../redux/features/userSlice";
import MemberCard from "../../../components/MemberCard/MemberCard";
import axios from "axios";
import "./MembersList.css";

const MembersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { members, status, error } = useSelector((state: RootState) => state.user);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const openModal = (member: User) => setSelectedMember(member);
  const closeModal = () => {
    setSelectedMember(null);
    setUpdateError(null);
  };

  const handleUpdateAddress = async (userId: string) => {
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:8080/api/users/${userId}/address`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedMember(response.data); // Met à jour le membre avec les nouvelles données
      console.log("✅ Adresse mise à jour avec succès pour l'utilisateur ID:", userId);
    } catch (err: any) {
      setUpdateError(err.response?.data || "Erreur lors de la mise à jour de l'adresse");
      console.error("❌ Erreur lors de la mise à jour de l'adresse:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatValue = (value: string | number | undefined) => value || "Non renseigné";

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

      {selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Détails du membre</h2>
            <p><strong>ID :</strong> {formatValue(selectedMember.id)}</p>
            <p><strong>Email :</strong> {formatValue(selectedMember.email)}</p>
            <p><strong>Prénom :</strong> {formatValue(selectedMember.firstName)}</p>
            <p><strong>Nom :</strong> {formatValue(selectedMember.lastName)}</p>
            <p><strong>Téléphone :</strong> {formatValue(selectedMember.phone)}</p>
            <p><strong>Adresse :</strong> {formatValue(selectedMember.address)}</p>
            <p><strong>Ville :</strong> {formatValue(selectedMember.city)}</p>
            <p><strong>Pays :</strong> {formatValue(selectedMember.country)}</p>
            <p><strong>Sexe :</strong> {formatValue(selectedMember.sex)}</p>
            <p><strong>Slug :</strong> {formatValue(selectedMember.slug)}</p>
            <p><strong>Bio :</strong> {formatValue(selectedMember.bio)}</p>
            <p><strong>Latitude :</strong> {formatValue(selectedMember.latitude)}</p>
            <p><strong>Longitude :</strong> {formatValue(selectedMember.longitude)}</p>

            {updateError && <p className="error-message">{updateError}</p>}
            <div className="modal-actions">
              <button
                className="update-address-button"
                onClick={() => handleUpdateAddress(selectedMember.id)}
                disabled={updateLoading || !selectedMember.latitude || !selectedMember.longitude}
              >
                {updateLoading ? "Mise à jour..." : "Mettre à jour l'adresse"}
              </button>
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