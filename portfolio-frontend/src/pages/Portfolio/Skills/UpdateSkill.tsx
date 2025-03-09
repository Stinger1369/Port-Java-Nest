import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateSkill } from "../../../redux/features/skillSlice";
import "./Skills.css";

interface Props {
  skill: {
    id: string;
    name: string;
    level: number;
    description?: string;
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
    const { name, value } = e.target;
    setUpdatedSkill((prev) => ({
      ...prev,
      [name]: name === "level" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateSkill({ id: updatedSkill.id, skillData: updatedSkill }));
    onClose();
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