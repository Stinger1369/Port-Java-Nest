import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateLanguage } from "../../../redux/features/languageSlice";

interface Props {
  language: {
    id: string;
    name: string;
    proficiencyLevel: string;
  };
  onClose: () => void;
}

const UpdateLanguage = ({ language, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedLanguage, setUpdatedLanguage] = useState(language);

  useEffect(() => {
    setUpdatedLanguage(language);
  }, [language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdatedLanguage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateLanguage({ id: updatedLanguage.id, languageData: updatedLanguage }));
    onClose();
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
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateLanguage;
