import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addExperience } from "../../../redux/features/experienceSlice";

interface Props {
  onClose: () => void;
}

const AddExperience = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [experience, setExperience] = useState({
    companyName: "",
    position: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setExperience((prev) => ({
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

    dispatch(addExperience({ ...experience, userId }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter une Expérience</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="companyName" value={experience.companyName} onChange={handleChange} placeholder="Nom de l'entreprise" required />
          <input type="text" name="position" value={experience.position} onChange={handleChange} placeholder="Poste" required />
          <input type="date" name="startDate" value={experience.startDate} onChange={handleChange} required />
          <input type="date" name="endDate" value={experience.endDate} onChange={handleChange} disabled={experience.currentlyWorking} />
          <label>
            <input type="checkbox" name="currentlyWorking" checked={experience.currentlyWorking} onChange={handleChange} />
            Actuellement en poste
          </label>
          <textarea name="description" value={experience.description} onChange={handleChange} placeholder="Description" />
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddExperience;
