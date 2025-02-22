import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addLanguage } from "../../../redux/features/languageSlice";

interface Props {
  onClose: () => void;
}

const AddLanguage = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [language, setLanguage] = useState({
    name: "",
    proficiencyLevel: "Débutant",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLanguage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addLanguage({ ...language, userId }));
    onClose();
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
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddLanguage;
