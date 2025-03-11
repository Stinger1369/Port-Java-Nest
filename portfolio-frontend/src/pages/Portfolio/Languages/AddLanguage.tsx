import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addLanguage, fetchLanguagesByUser } from "../../../redux/features/languageSlice";

interface Props {
  onClose: () => void;
}

const AddLanguage = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [language, setLanguage] = useState({
    name: "",
    proficiencyLevel: "Débutant",
    isPublic: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setLanguage((prev) => ({
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

    dispatch(addLanguage({ ...language, userId }))
      .unwrap()
      .then(() => {
        dispatch(fetchLanguagesByUser(userId));
        onClose();
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de la langue:", err);
        alert("Erreur lors de l'ajout de la langue.");
      });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter une Langue</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={language.name} onChange={handleChange} placeholder="Nom de la langue" required />
          <select name="proficiencyLevel" value={language.proficiencyLevel} onChange={handleChange} required>
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
              checked={language.isPublic}
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

export default AddLanguage;