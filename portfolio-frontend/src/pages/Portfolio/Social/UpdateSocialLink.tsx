import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateSocialLink, fetchSocialLinksByUser } from "../../../redux/features/socialLinkSlice";
import "./Social.css";

interface Props {
  socialLink: {
    id: string;
    platform: string;
    url: string;
    isPublic?: boolean;
  };
  onClose: () => void;
}

const UpdateSocialLink = ({ socialLink, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>(); // Correction de la faute de frappe

  const [updatedSocialLink, setUpdatedSocialLink] = useState({
    id: socialLink.id,
    platform: socialLink.platform || "",
    url: socialLink.url || "",
    isPublic: socialLink.isPublic || false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (socialLink) {
      setUpdatedSocialLink({
        id: socialLink.id,
        platform: socialLink.platform || "",
        url: socialLink.url || "",
        isPublic: socialLink.isPublic || false,
      });
    }
  }, [socialLink]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setUpdatedSocialLink((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(updateSocialLink({ id: updatedSocialLink.id, socialLinkData: updatedSocialLink }))
        .unwrap()
        .then(() => {
          setSuccessMessage("Lien social mis à jour avec succès !");
          dispatch(fetchSocialLinksByUser(userId));
          setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour du lien social:", err);
          setErrorMessage("Erreur lors de la mise à jour du lien social.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier un Lien Social</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="platform"
            value={updatedSocialLink.platform}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="url"
            value={updatedSocialLink.url}
            onChange={handleChange}
            required
          />
          <label>
            Public :
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedSocialLink.isPublic}
              onChange={handleChange}
            />
          </label>
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateSocialLink;