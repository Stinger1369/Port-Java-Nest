import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchAllUsers, User, fetchUserById } from "../../../redux/features/userSlice";
import { getImagesByIds, getAllImagesByUserId, Image } from "../../../redux/features/imageSlice";
import { useNavigate } from "react-router-dom";
import MemberCard from "../../../components/MemberCard/MemberCard";
import { useFriendActions } from "../../../redux/features/friendActions";
import "./MembersList.css";

const MembersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, members, status, error } = useSelector((state: RootState) => state.user);
  const { images, status: imageStatus, error: imageError } = useSelector((state: RootState) => state.image);
  const {
    loadFriends,
    loadSentFriendRequests,
    loadReceivedFriendRequests,
    friends,
    sentRequests,
    receivedRequests,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
  } = useFriendActions();
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [selectedMemberImages, setSelectedMemberImages] = useState<Image[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);

  // Charger les données initiales au montage (une seule fois)
  useEffect(() => {
    if (!token) {
      console.log("🔴 Aucun token, redirection vers login");
      navigate("/login");
      return;
    }

    // Charger les utilisateurs
    if (status === "idle") {
      console.log("🔍 Chargement initial des membres...");
      dispatch(fetchAllUsers())
        .unwrap()
        .then((result) => {
          console.log("🔍 Utilisateurs chargés:", result.length, "membres");
        })
        .catch((err) => {
          console.error("❌ Erreur lors du chargement des utilisateurs:", err);
        });
    }

    // Charger les données des amis et demandes une seule fois
    if (user?.id && status !== "loading") {
      loadFriends();
      loadSentFriendRequests();
      loadReceivedFriendRequests();
    }
  }, [dispatch, status, token, navigate, user?.id]); // Simplifié les dépendances

  // Charger les images des membres
  useEffect(() => {
    if (members.length > 0 && !imagesLoaded && token) {
      const allImageIds = members
        .flatMap((member: User) => member.imageIds || [])
        .filter((id, index, self) => id && self.indexOf(id) === index);
      if (allImageIds.length > 0) {
        console.log("🔍 Récupération des images de profil par IDs:", allImageIds);
        dispatch(getImagesByIds(allImageIds))
          .unwrap()
          .then(() => {
            console.log("✅ Toutes les images de profil des membres ont été chargées:", images);
            setImagesLoaded(true);
          })
          .catch((err) => {
            console.error("❌ Erreur lors du chargement des images de profil:", err);
            setImagesLoaded(true);
          });
      } else {
        console.log("⚠️ Aucun imageIds trouvé pour les membres");
        setImagesLoaded(true);
      }
    }
  }, [members, imagesLoaded, dispatch, token]);

  // Logs pour débogage (limité aux changements d'état des images)
  useEffect(() => {
    console.log("🔍 Statut des images:", imageStatus, "Erreur:", imageError);
  }, [imageStatus, imageError]);

  const getProfileImage = (userId: string): string | null => {
    const userImages = images.filter((img) => img.userId === userId);
    const profileImg = userImages.find((img) => img.isProfilePicture && !img.isNSFW);
    return profileImg?.path || null;
  };

  // Mémoriser les images de profil pour éviter les recalculs
  const memberCards = useMemo(() => {
    return members.map((member) => (
      <MemberCard
        key={member.id}
        member={member}
        profileImage={getProfileImage(member.id)}
        onClick={() => openModal(member)}
      />
    ));
  }, [members, images]); // Dépendances : members et images

  const openModal = async (member: User) => {
    setSelectedMember(member);
    await dispatch(fetchUserById(member.id))
      .unwrap()
      .catch((err) => console.error("❌ Erreur lors de la récupération des détails du membre:", err));

    if (member.id) {
      dispatch(getAllImagesByUserId(member.id))
        .unwrap()
        .then((result) => {
          const allImages = [...result.images];
          const sortedImages = allImages.sort((a: Image, b: Image) => {
            if (a.isProfilePicture && !b.isProfilePicture) return -1;
            if (!a.isProfilePicture && b.isProfilePicture) return 1;
            return 0;
          });
          setSelectedMemberImages(sortedImages);
          console.log(`✅ Toutes les images chargées pour ${member.id}:`, sortedImages);
        })
        .catch((err) => console.error(`❌ Erreur lors du chargement des images pour ${member.id}:`, err));
    }
  };

  const closeModal = () => {
    setSelectedMember(null);
    setSelectedMemberImages([]);
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const formatValue = (value: string | number | undefined | string[]): string => {
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Aucun";
    return value?.toString() || "Non renseigné";
  };

  const getUpdatedMember = () => {
    if (!selectedMember) return null;
    return members.find((m) => m.id === selectedMember.id) || selectedMember;
  };

  if (status === "loading" || imageStatus === "loading" || !imagesLoaded) {
    return <p className="loading">⏳ Chargement des membres et des images...</p>;
  }

  if (error) {
    return <p className="error-message">❌ Erreur utilisateurs : {error}</p>;
  }

  if (imageError) {
    return <p className="error-message">❌ Erreur images : {imageError}</p>;
  }

  if (members.length === 0) {
    return (
      <div className="members-list-container">
        <h1>Liste des membres</h1>
        <p>Aucun membre trouvé.</p>
      </div>
    );
  }

  const displayedMember = getUpdatedMember();
  const currentUserId = user?.id || localStorage.getItem("userId");
  const isCurrentUser = displayedMember && currentUserId === displayedMember.id;

  return (
    <div className="members-list-container">
      <h1>Liste des membres</h1>
      <div className="members-grid">{memberCards}</div>

      {/* Afficher les demandes d'amis reçues */}
      <div className="friend-requests-section">
        <h2>Demandes d'amis reçues</h2>
        {receivedRequests.length === 0 ? (
          <p>Aucune demande d'ami reçue.</p>
        ) : (
          <ul className="friend-requests-list">
            {receivedRequests.map((request) => (
              <li key={request.id} className="friend-request-item">
                <span>
                  {request.firstName} {request.lastName} ({request.email})
                </span>
                <div className="friend-request-actions">
                  <button
                    className="accept-button"
                    onClick={() => handleAcceptFriendRequest(request.id)}
                  >
                    <i className="fas fa-check"></i> Accepter
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleRejectFriendRequest(request.id)}
                  >
                    <i className="fas fa-times"></i> Refuser
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {displayedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Détails du membre</h2>
            <div className="modal-avatar">
              {selectedMemberImages.length > 0 ? (
                <div className="modal-images">
                  {selectedMemberImages.map((img) => (
                    <img
                      key={img.id}
                      src={`http://localhost:7000/${img.path}`}
                      alt={img.name}
                      className="modal-image"
                    />
                  ))}
                </div>
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
            <p><strong>Image IDs :</strong> {formatValue(displayedMember.imageIds)}</p>

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