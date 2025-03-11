import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addSocialLink, fetchSocialLinksByUser } from "../../../redux/features/socialLinkSlice";

interface Props {
  onClose: () => void;
}

const AddSocialLink = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [socialLink, setSocialLink] = useState({
    platform: "",
    url: "",
    isPublic: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setSocialLink((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addSocialLink({ ...socialLink, userId }))
      .unwrap()
      .then(() => {
        dispatch(fetchSocialLinksByUser(userId));
        onClose();
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout du lien social:", err);
        alert("Erreur lors de l'ajout du lien social.");
      });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter un Lien Social</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="platform" value={socialLink.platform} onChange={handleChange} placeholder="Plateforme (ex: LinkedIn, Twitter)" required />
          <input type="text" name="url" value={socialLink.url} onChange={handleChange} placeholder="URL du profil" required />
          <label>
            Public :
            <input
              type="checkbox"
              name="isPublic"
              checked={socialLink.isPublic}
              onChange={handleChange}
            />
          </label>
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddSocialLink;