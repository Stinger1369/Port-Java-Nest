import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateLanguage, fetchLanguagesByUser } from "../../../redux/features/languageSlice";
import "./Languages.css";

interface Props {
  language: {
    id: string;
    name: string;
    proficiencyLevel: string;
    isPublic?: boolean;
  };
  onClose: () => void;
}

const UpdateLanguage = ({ language, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedLanguage, setUpdatedLanguage] = useState({
    ...language,
    isPublic: language.isPublic || false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setUpdatedLanguage({
      ...language,
      isPublic: language.isPublic || false,
    });
  }, [language]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setUpdatedLanguage((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(updateLanguage({ id: updatedLanguage.id, languageData: updatedLanguage }))
        .unwrap()
        .then(() => {
          setSuccessMessage("Langue mise à jour avec succès !");
          dispatch(fetchLanguagesByUser(userId));
          setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la langue:", err);
          setErrorMessage("Erreur lors de la mise à jour de la langue.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier la Langue</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={updatedLanguage.name}
            onChange={handleChange}
            required
          />
          <select
            name="proficiencyLevel"
            value={updatedLanguage.proficiencyLevel}
            onChange={handleChange}
            required
          >
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
            <option value="Courant">Courant</option>
          </select>
          <label>
            Public :
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedLanguage.isPublic}
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

export default UpdateLanguage;