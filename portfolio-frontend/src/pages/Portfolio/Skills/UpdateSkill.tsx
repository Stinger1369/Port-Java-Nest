import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateSkill, fetchSkillsByUser } from "../../../redux/features/skillSlice";
import "./Skills.css";

interface Props {
  skill: {
    id: string;
    name: string;
    level: number;
    description?: string;
    isPublic?: boolean; // Ajouté
  };
  onClose: () => void;
}

const UpdateSkill = ({ skill, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [updatedSkill, setUpdatedSkill] = useState(skill);

  useEffect(() => {
    setUpdatedSkill(skill);
  }, [skill]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedSkill((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "level" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(updateSkill({ id: updatedSkill.id, skillData: updatedSkill }))
        .unwrap()
        .then(() => {
          dispatch(fetchSkillsByUser(userId));
          onClose();
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la compétence:", err);
          alert("Erreur lors de la mise à jour de la compétence.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="skill-form-container">
        <h3 className="skill-form-title">Modifier la Compétence</h3>
        <form onSubmit={handleSubmit}>
          <label className="skill-label">Nom de la compétence *</label>
          <input
            type="text"
            name="name"
            value={updatedSkill.name}
            onChange={handleChange}
            required
            className="skill-input"
          />

          <label className="skill-label">Niveau (0-100) *</label>
          <input
            type="number"
            name="level"
            value={updatedSkill.level}
            onChange={handleChange}
            min="0"
            max="100"
            required
            className="skill-input"
          />

          <label className="skill-label">Description</label>
          <textarea
            name="description"
            value={updatedSkill.description}
            onChange={handleChange}
            className="skill-textarea"
          />

          <label className="skill-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedSkill.isPublic || false}
              onChange={handleChange}
            />
            Public
          </label>

          <button type="submit" className="skill-button skill-button-submit">
            Mettre à jour
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

export default UpdateSkill;