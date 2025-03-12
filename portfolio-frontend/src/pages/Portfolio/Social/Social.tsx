import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import {
  fetchSocialLinksByUser,
  deleteSocialLink,
  updateSocialLink,
} from "../../../redux/features/socialLinkSlice";
import AddSocialLink from "./AddSocialLink";
import UpdateSocialLink from "./UpdateSocialLink";
import "./Social.css";

const Social = () => {
  const dispatch = useDispatch<AppDispatch>();
  const socialLinks = useSelector((state: RootState) => state.socialLink.socialLinks) || [];
  const status = useSelector((state: RootState) => state.socialLink.status);
  const error = useSelector((state: RootState) => state.socialLink.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSocialLink, setSelectedSocialLink] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [socialLinkIdToDelete, setSocialLinkIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchSocialLinksByUser(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleTogglePublic = (socialLinkId: string) => {
    const socialLink = socialLinks.find((link) => link.id === socialLinkId);
    if (socialLink && userId) {
      dispatch(
        updateSocialLink({
          id: socialLinkId,
          socialLinkData: { platform: socialLink.platform, url: socialLink.url, isPublic: !socialLink.isPublic },
        })
      )
        .unwrap()
        .then(() => {
          setSuccessMessage("Visibilité du lien social mise à jour avec succès !");
          dispatch(fetchSocialLinksByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour du lien social:", err);
          setErrorMessage("Erreur lors de la mise à jour du lien social.");
        });
    }
  };

  const handleDeleteSocialLink = (socialLinkId: string) => {
    setSocialLinkIdToDelete(socialLinkId);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (socialLinkIdToDelete && userId) {
      dispatch(deleteSocialLink(socialLinkIdToDelete))
        .unwrap()
        .then(() => {
          setSuccessMessage("Lien social supprimé avec succès !");
          dispatch(fetchSocialLinksByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression du lien social:", err);
          setErrorMessage("Erreur lors de la suppression du lien social.");
        });
    }
    setShowConfirmModal(false);
    setSocialLinkIdToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setSocialLinkIdToDelete(null);
  };

  return (
    <div className="social-container">
      <h2>Liens vers les Réseaux Sociaux</h2>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {status === "loading" && <p className="loading-text">Chargement des liens sociaux...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {socialLinks.length > 0 ? (
        <ul className="social-list">
          {socialLinks.map((link) => (
            <li key={link.id} className="social-item">
              <div className="social-info">
                <strong>{link.platform}</strong>
                <p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.url}
                  </a>
                </p>
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={link.isPublic || false}
                    onChange={() => handleTogglePublic(link.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedSocialLink(link)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteSocialLink(link.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-social-text">Aucun lien social enregistré.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddSocialLink onClose={() => setShowAddForm(false)} />}
      {selectedSocialLink && <UpdateSocialLink socialLink={selectedSocialLink} onClose={() => setSelectedSocialLink(null)} />}

      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer ce lien social ?</p>
            <div className="confirm-modal-actions">
              <button className="confirm-button" onClick={confirmDelete}>Oui</button>
              <button className="cancel-button" onClick={cancelDelete}>Non</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;