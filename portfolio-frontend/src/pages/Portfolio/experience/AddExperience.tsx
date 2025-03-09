import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addExperience } from "../../../redux/features/experienceSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Experience.css";

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

  const handleDateChange = (name: string, value: string) => {
    setExperience((prev) => ({
      ...prev,
      [name]: value,
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
      <div className="experience-form-container">
        <h3 className="experience-form-title">Ajouter une Expérience</h3>
        <form onSubmit={handleSubmit}>
          <label className="experience-label">Nom de l'entreprise *</label>
          <input
            type="text"
            name="companyName"
            value={experience.companyName}
            onChange={handleChange}
            placeholder="Nom de l'entreprise"
            required
            className="experience-input"
          />

          <label className="experience-label">Poste *</label>
          <input
            type="text"
            name="position"
            value={experience.position}
            onChange={handleChange}
            placeholder="Poste"
            required
            className="experience-input"
          />

          <label className="experience-label">Date de début *</label>
          <DatePicker
            name="startDate"
            value={experience.startDate}
            onChange={handleDateChange}
            required
            className="experience-date-picker"
          />

          <label className="experience-label">Date de fin</label>
          <DatePicker
            name="endDate"
            value={experience.endDate}
            onChange={handleDateChange}
            disabled={experience.currentlyWorking}
            minDate={experience.startDate}
            className="experience-date-picker"
          />

          <label className="experience-checkbox-label">
            <input
              type="checkbox"
              name="currentlyWorking"
              checked={experience.currentlyWorking}
              onChange={handleChange}
            />
            Actuellement en poste
          </label>

          <label className="experience-label">Description</label>
          <textarea
            name="description"
            value={experience.description}
            onChange={handleChange}
            placeholder="Description"
            className="experience-textarea"
          />

          <button type="submit" className="experience-button experience-button-submit">
            Ajouter
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

export default AddExperience;