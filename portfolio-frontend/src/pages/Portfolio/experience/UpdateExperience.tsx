import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateExperience } from "../../../redux/features/experienceSlice";

interface Props {
  experience: {
    id: string;
    companyName?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    currentlyWorking?: boolean;
    description?: string;
  };
  onClose: () => void;
}

const UpdateExperience = ({ experience, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // ✅ Initialisation correcte des valeurs pour éviter undefined
  const [updatedExperience, setUpdatedExperience] = useState({
    id: experience.id,
    companyName: experience.companyName || "",
    position: experience.position || "",
    startDate: experience.startDate || "",
    endDate: experience.endDate || "",
    currentlyWorking: experience.currentlyWorking || false,
    description: experience.description || "",
  });

  useEffect(() => {
    if (experience) {
      setUpdatedExperience({
        id: experience.id,
        companyName: experience.companyName || "",
        position: experience.position || "",
        startDate: experience.startDate || "",
        endDate: experience.endDate || "",
        currentlyWorking: experience.currentlyWorking || false,
        description: experience.description || "",
      });
    }
  }, [experience]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedExperience((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateExperience({ id: updatedExperience.id, experienceData: updatedExperience }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier l'Expérience</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="companyName"
            value={updatedExperience.companyName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="position"
            value={updatedExperience.position}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="startDate"
            value={updatedExperience.startDate}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="endDate"
            value={updatedExperience.endDate}
            onChange={handleChange}
            disabled={updatedExperience.currentlyWorking}
          />
          <label>
            <input
              type="checkbox"
              name="currentlyWorking"
              checked={updatedExperience.currentlyWorking}
              onChange={handleChange}
            />
            Actuellement en poste
          </label>
          <textarea
            name="description"
            value={updatedExperience.description}
            onChange={handleChange}
          />
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateExperience;
