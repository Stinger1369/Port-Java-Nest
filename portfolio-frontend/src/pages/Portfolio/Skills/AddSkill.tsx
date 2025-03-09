import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addSkill } from "../../../redux/features/skillSlice";
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSkill((prev) => ({
      ...prev,
      [name]: name === "level" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addSkill({ ...skill, userId }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="skill-form-container">
        <h3 className="skill-form-title">Ajouter une Compétence</h3>
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