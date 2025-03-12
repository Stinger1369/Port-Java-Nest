import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addSkill, fetchSkillsByUser } from "../../../redux/features/skillSlice";
import "./Skills.css";

interface Props {
  onClose: () => void;
}

const AddSkill = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [skill, setSkill] = useState({
    name: "",
    level: 50,
    description: "",
    isPublic: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setSkill((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "level" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      setErrorMessage("Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addSkill({ ...skill, userId }))
      .unwrap()
      .then(() => {
        setSuccessMessage("Compétence ajoutée avec succès !");
        dispatch(fetchSkillsByUser(userId));
        setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de la compétence:", err);
        setErrorMessage("Erreur lors de l’ajout de la compétence.");
      });
  };

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

  return (
    <div className="modal">
      <div className="skill-form-container">
        <h3 className="skill-form-title">Ajouter une Compétence</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="skill-label">Nom de la compétence *</label>
          <input
            type="text"
            name="name"
            value={skill.name}
            onChange={handleChange}
            placeholder="Nom de la compétence"
            required
            className="skill-input"
          />

          <label className="skill-label">Niveau (0-100) *</label>
          <input
            type="number"
            name="level"
            value={skill.level}
            onChange={handleChange}
            min="0"
            max="100"
            required
            className="skill-input"
          />

          <label className="skill-label">Description</label>
          <textarea
            name="description"
            value={skill.description}
            onChange={handleChange}
            placeholder="Description"
            className="skill-textarea"
          />

          <label className="skill-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={skill.isPublic}
              onChange={handleChange}
            />
            Public
          </label>

          <button type="submit" className="skill-button skill-button-submit">
            Ajouter
          </button>
          <button
            type="button"
            onClick={onClose}
            className="skill-button skill-button-cancel"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSkill;