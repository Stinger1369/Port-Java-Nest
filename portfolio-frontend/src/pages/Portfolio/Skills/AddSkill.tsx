import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addSkill } from "../../../redux/features/skillSlice";

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
      <h3>Ajouter une Compétence</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={skill.name} onChange={handleChange} placeholder="Nom de la compétence" required />
        <input type="number" name="level" value={skill.level} onChange={handleChange} min="0" max="100" required />
        <textarea name="description" value={skill.description} onChange={handleChange} placeholder="Description" />
        <button type="submit">Ajouter</button>
        <button type="button" onClick={onClose}>Annuler</button>
      </form>
    </div>
  );
};

export default AddSkill;
