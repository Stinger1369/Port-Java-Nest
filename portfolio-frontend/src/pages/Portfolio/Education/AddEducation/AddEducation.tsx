import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux/store";
import { addEducation, fetchEducationsByUser } from "../../../../redux/features/educationSlice";
import DatePicker from "../../../../components/common/DatePicker";
import "./AddEducation.css";

interface Props {
  onClose: () => void;
}

const AddEducation = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [education, setEducation] = useState({
    schoolName: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    currentlyStudying: false,
    description: "",
    isPublic: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = () => {
    const requiredFields = education.schoolName && education.degree && education.startDate;
    if (education.currentlyStudying) {
      return requiredFields;
    }
    return requiredFields && education.endDate;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setEducation((prev) => {
      const updatedEducation = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "currentlyStudying" && checked) {
        updatedEducation.endDate = "";
      }
      return updatedEducation;
    });
  };

  const handleDateChange = (name: string, value: string) => {
    setEducation((prev) => ({
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

    dispatch(addEducation({ ...education, userId }))
      .unwrap()
      .then(() => {
        setSuccessMessage("Formation ajoutée avec succès !");
        dispatch(fetchEducationsByUser(userId));
        setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de la formation:", err);
        setErrorMessage("Erreur lors de l’ajout de la formation.");
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
    <div className="modal-overlay">
      <div className="education-form-container">
        <h3 className="education-form-title">Ajouter une Formation</h3>
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
            value={education.schoolName}
            onChange={handleChange}
            placeholder="Nom de l'école"
            required
            className="education-input"
          />

          <label className="education-label">Diplôme *</label>
          <input
            type="text"
            name="degree"
            value={education.degree}
            onChange={handleChange}
            placeholder="Diplôme"
            required
            className="education-input"
          />

          <label className="education-label">Domaine d'étude *</label>
          <input
            type="text"
            name="fieldOfStudy"
            value={education.fieldOfStudy}
            onChange={handleChange}
            placeholder="Domaine d'étude"
            required
            className="education-input"
          />

          <label className="education-label">Date de début *</label>
          <DatePicker
            name="startDate"
            value={education.startDate}
            onChange={handleDateChange}
            required
            className="education-date-picker"
          />

          <label className="education-label">Date de fin</label>
          <DatePicker
            name="endDate"
            value={education.endDate}
            onChange={handleDateChange}
            disabled={education.currentlyStudying}
            minDate={education.startDate}
            className="education-date-picker"
          />

          <label className="education-checkbox-label">
            <input
              type="checkbox"
              name="currentlyStudying"
              checked={education.currentlyStudying}
              onChange={handleChange}
            />
            Actuellement en cours
          </label>

          <label className="education-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={education.isPublic}
              onChange={handleChange}
            />
            Public
          </label>

          <label className="education-label">Description</label>
          <textarea
            name="description"
            value={education.description}
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
              Ajouter
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

export default AddEducation;