import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateExperience } from "../../../redux/features/experienceSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Experience.css";

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

  const handleDateChange = (name: string, value: string) => {
    setUpdatedExperience((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateExperience({ id: updatedExperience.id, experienceData: updatedExperience }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="experience-form-container">
        <h3 className="experience-form-title">Modifier l'Expérience</h3>
        <form onSubmit={handleSubmit}>
          <label className="experience-label">Nom de l'entreprise *</label>
          <input
            type="text"
            name="companyName"
            value={updatedExperience.companyName}
            onChange={handleChange}
            required
            className="experience-input"
          />

          <label className="experience-label">Poste *</label>
          <input
            type="text"
            name="position"
            value={updatedExperience.position}
            onChange={handleChange}
            required
            className="experience-input"
          />

          <label className="experience-label">Date de début *</label>
          <DatePicker
            name="startDate"
            value={updatedExperience.startDate}
            onChange={handleDateChange}
            required
            className="experience-date-picker"
          />

          <label className="experience-label">Date de fin</label>
          <DatePicker
            name="endDate"
            value={updatedExperience.endDate || ""}
            onChange={handleDateChange}
            disabled={updatedExperience.currentlyWorking}
            minDate={updatedExperience.startDate}
            className="experience-date-picker"
          />

          <label className="experience-checkbox-label">
            <input
              type="checkbox"
              name="currentlyWorking"
              checked={updatedExperience.currentlyWorking}
              onChange={handleChange}
            />
            Actuellement en poste
          </label>

          <label className="experience-label">Description</label>
          <textarea
            name="description"
            value={updatedExperience.description}
            onChange={handleChange}
            className="experience-textarea"
          />

          <button type="submit" className="experience-button experience-button-submit">
            Mettre à jour
          </button>
          <button
            type="button"
            onClick={onClose}
            className="experience-button experience-button-cancel"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateExperience;