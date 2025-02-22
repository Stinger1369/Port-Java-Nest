import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import {
  fetchSocialLinksByUser,
  deleteSocialLink,
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

  useEffect(() => {
    if (userId) {
      dispatch(fetchSocialLinksByUser(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="social-container">
      <h2>Liens vers les Réseaux Sociaux</h2>

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
                <button className="edit-button" onClick={() => setSelectedSocialLink(link)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteSocialLink(link.id))}>🗑️</button>
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
    </div>
  );
};

export default Social;
