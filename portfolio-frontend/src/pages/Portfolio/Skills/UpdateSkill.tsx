import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateSkill } from "../../../redux/features/skillSlice";

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
      <h3>Modifier la Compétence</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={updatedSkill.name} onChange={handleChange} required />
        <input type="number" name="level" value={updatedSkill.level} onChange={handleChange} min="0" max="100" required />
        <textarea name="description" value={updatedSkill.description} onChange={handleChange} />
        <button type="submit">Mettre à jour</button>
        <button type="button" onClick={onClose}>Annuler</button>
      </form>
    </div>
  );
};

export default UpdateSkill;
