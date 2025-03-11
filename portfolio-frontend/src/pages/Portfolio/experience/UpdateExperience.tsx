import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateExperience, fetchExperiencesByUser } from "../../../redux/features/experienceSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Experience.css";

interface Props {
  experience: {
    id: string;
    companyName?: string;
    jobTitle?: string;
    startDate?: string;
    endDate?: string;
    currentlyWorking?: boolean;
    description?: string;
    isPublic?: boolean;
  };
  onClose: () => void;
}

const UpdateExperience = ({ experience, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedExperience, setUpdatedExperience] = useState({
    id: experience.id,
    companyName: experience.companyName || "",
    jobTitle: experience.jobTitle || "",
    startDate: experience.startDate || "",
    endDate: experience.endDate || "",
    currentlyWorking: experience.currentlyWorking || false,
    description: experience.description || "",
    isPublic: experience.isPublic || false,
  });

  useEffect(() => {
    if (experience) {
      setUpdatedExperience({
        id: experience.id,
        companyName: experience.companyName || "",
        jobTitle: experience.jobTitle || "",
        startDate: experience.startDate || "",
        endDate: experience.endDate || "",
        currentlyWorking: experience.currentlyWorking || false,
        description: experience.description || "",
        isPublic: experience.isPublic || false,
      });
    }
  }, [experience]);

  // Vérifier si tous les champs obligatoires sont remplis
  const isFormValid = () => {
    const requiredFields = updatedExperience.companyName && updatedExperience.jobTitle && updatedExperience.startDate;
    if (updatedExperience.currentlyWorking) {
      return requiredFields; // Pas besoin de endDate si currentlyWorking est true
    }
    return requiredFields && updatedExperience.endDate; // endDate est requis si currentlyWorking est false
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedExperience((prev) => {
      const updatedExp = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // Si currentlyWorking est true, vide le champ endDate
      if (name === "currentlyWorking" && checked) {
        updatedExp.endDate = "";
      }
      return updatedExp;
    });
  };

  const handleDateChange = (name: string, value: string) => {
    setUpdatedExperience((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(updateExperience({ id: updatedExperience.id, experienceData: updatedExperience }))
        .unwrap()
        .then(() => {
          dispatch(fetchExperiencesByUser(userId));
          onClose();
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de l'expérience:", err);
          alert("Erreur lors de la mise à jour de l'expérience.");
        });
    }
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
            name="jobTitle"
            value={updatedExperience.jobTitle}
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

          <label className="experience-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedExperience.isPublic}
              onChange={handleChange}
            />
            Public
          </label>

          <label className="experience-label">Description</label>
          <textarea
            name="description"
            value={updatedExperience.description}
            onChange={handleChange}
            className="experience-textarea"
          />

          <button
            type="submit"
            className="experience-button experience-button-submit"
            disabled={!isFormValid()} // Désactiver si le formulaire n'est pas valide
          >
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