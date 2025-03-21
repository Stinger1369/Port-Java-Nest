import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux/store";
import { updateEducation, fetchEducationsByUser } from "../../../../redux/features/educationSlice";
import DatePicker from "../../../../components/common/DatePicker";
import "./UpdateEducation.css";

interface Props {
  education: {
    id: string;
    schoolName: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    currentlyStudying: boolean;
    description?: string;
    isPublic?: boolean;
  };
  onClose: () => void;
}

const UpdateEducation = ({ education, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedEducation, setUpdatedEducation] = useState(education);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setUpdatedEducation(education);
  }, [education]);

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

  const isFormValid = () => {
    const requiredFields = updatedEducation.schoolName && updatedEducation.degree && updatedEducation.startDate;
    if (updatedEducation.currentlyStudying) {
      return requiredFields;
    }
    return requiredFields && updatedEducation.endDate;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedEducation((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setUpdatedEducation((prev) => ({
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

    dispatch(updateEducation({ id: updatedEducation.id, educationData: updatedEducation }))
      .unwrap()
      .then(() => {
        setSuccessMessage("Formation mise à jour avec succès !");
        dispatch(fetchEducationsByUser(userId));
        setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
      })
      .catch((err) => {
        console.error("❌ Erreur lors de la mise à jour de la formation:", err);
        setErrorMessage("Erreur lors de la mise à jour de la formation.");
      });
  };

  return (
    <div className="modal-overlay">
      <div className="education-form-container">
        <h3 className="education-form-title">Modifier la Formation</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="education-label">Nom de l'école *</label>
          <input
            type="text"
            name="schoolName"
            value={updatedEducation.schoolName}
            onChange={handleChange}
            placeholder="Nom de l'école"
            required
            className="education-input"
          />

          <label className="education-label">Diplôme *</label>
          <input
            type="text"
            name="degree"
            value={updatedEducation.degree}
            onChange={handleChange}
            placeholder="Diplôme"
            required
            className="education-input"
          />

          <label className="education-label">Domaine d'étude *</label>
          <input
            type="text"
            name="fieldOfStudy"
            value={updatedEducation.fieldOfStudy}
            onChange={handleChange}
            placeholder="Domaine d'étude"
            required
            className="education-input"
          />

          <label className="education-label">Date de début *</label>
          <DatePicker
            name="startDate"
            value={updatedEducation.startDate}
            onChange={handleDateChange}
            required
            className="education-date-picker"
          />

          <label className="education-label">Date de fin</label>
          <DatePicker
            name="endDate"
            value={updatedEducation.endDate || ""}
            onChange={handleDateChange}
            disabled={updatedEducation.currentlyStudying}
            minDate={updatedEducation.startDate}
            className="education-date-picker"
          />

          <label className="education-checkbox-label">
            <input
              type="checkbox"
              name="currentlyStudying"
              checked={updatedEducation.currentlyStudying}
              onChange={handleChange}
            />
            Actuellement en cours
          </label>

          <label className="education-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedEducation.isPublic || false}
              onChange={handleChange}
            />
            Public
          </label>

          <label className="education-label">Description</label>
          <textarea
            name="description"
            value={updatedEducation.description || ""}
            onChange={handleChange}
            placeholder="Description"
            className="education-textarea"
          />

          <div className="education-buttons">
            <button
              type="submit"
              className="education-button education-button-submit"
              disabled={!isFormValid()}
            >
              Mettre à jour
            </button>
            <button
              type="button"
              onClick={onClose}
              className="education-button education-button-cancel"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEducation;