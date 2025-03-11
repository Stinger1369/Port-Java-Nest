import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateLanguage, fetchLanguagesByUser } from "../../../redux/features/languageSlice";

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

  useEffect(() => {
    setUpdatedLanguage({
      ...language,
      isPublic: language.isPublic || false,
    });
  }, [language]);

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
          dispatch(fetchLanguagesByUser(userId));
          onClose();
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la langue:", err);
          alert("Erreur lors de la mise à jour de la langue.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier la Langue</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={updatedLanguage.name} onChange={handleChange} required />
          <select name="proficiencyLevel" value={updatedLanguage.proficiencyLevel} onChange={handleChange} required>
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