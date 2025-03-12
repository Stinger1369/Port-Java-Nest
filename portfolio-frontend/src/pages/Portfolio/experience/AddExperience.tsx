import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addExperience, fetchExperiencesByUser } from "../../../redux/features/experienceSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Experience.css";

interface Props {
  onClose: () => void;
}

const AddExperience = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [experience, setExperience] = useState({
    companyName: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
    isPublic: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = () => {
    const requiredFields = experience.companyName && experience.jobTitle && experience.startDate;
    if (experience.currentlyWorking) {
      return requiredFields;
    }
    return requiredFields && experience.endDate;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setExperience((prev) => {
      const updatedExperience = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "currentlyWorking" && checked) {
        updatedExperience.endDate = "";
      }
      return updatedExperience;
    });
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
      setErrorMessage("Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addExperience({ ...experience, userId }))
      .unwrap()
      .then(() => {
        setSuccessMessage("Expérience ajoutée avec succès !");
        dispatch(fetchExperiencesByUser(userId));
        setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de l'expérience:", err);
        setErrorMessage("Erreur lors de l’ajout de l’expérience.");
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
      <div className="experience-form-container">
        <h3 className="experience-form-title">Ajouter une Expérience</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
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
            name="jobTitle"
            value={experience.jobTitle}
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

          <label className="experience-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={experience.isPublic}
              onChange={handleChange}
            />
            Public
          </label>

          <label className="experience-label">Description</label>
          <textarea
            name="description"
            value={experience.description}
            onChange={handleChange}
            placeholder="Description"
            className="experience-textarea"
          />

          <button
            type="submit"
            className="experience-button experience-button-submit"
            disabled={!isFormValid()}
          >
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