import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux/store";
import { addEducation } from "../../../../redux/features/educationSlice";
import "./AddEducation.css"; // ✅ Import du CSS

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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setEducation((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId"); // ✅ Récupération de l'userId
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    // ✅ Envoi de l'éducation avec userId
    dispatch(addEducation({ ...education, userId }));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Ajouter une Formation</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="schoolName"
            value={education.schoolName}
            onChange={handleChange}
            placeholder="Nom de l'école"
            required
          />
          <input
            type="text"
            name="degree"
            value={education.degree}
            onChange={handleChange}
            placeholder="Diplôme"
            required
          />
          <input
            type="text"
            name="fieldOfStudy"
            value={education.fieldOfStudy}
            onChange={handleChange}
            placeholder="Domaine d'étude"
            required
          />
          <input
            type="date"
            name="startDate"
            value={education.startDate}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="endDate"
            value={education.endDate}
            onChange={handleChange}
            disabled={education.currentlyStudying}
          />
          <label>
            <input
              type="checkbox"
              name="currentlyStudying"
              checked={education.currentlyStudying}
              onChange={handleChange}
            />
            Actuellement en cours
          </label>
          <textarea
            name="description"
            value={education.description}
            onChange={handleChange}
            placeholder="Description"
          />
          <div className="modal-buttons">
            <button type="submit" className="add-btn">Ajouter</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEducation;
