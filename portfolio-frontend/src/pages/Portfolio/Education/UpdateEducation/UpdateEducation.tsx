import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux/store";
import { updateEducation } from "../../../../redux/features/educationSlice";
import "./UpdateEducation.css"; // ✅ Import du CSS

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
  };
  onClose: () => void;
}

const UpdateEducation = ({ education, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedEducation, setUpdatedEducation] = useState(education);

  useEffect(() => {
    setUpdatedEducation(education); // ✅ Mise à jour lorsque l'éducation change
  }, [education]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedEducation((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateEducation({ id: updatedEducation.id, educationData: updatedEducation }));
    onClose(); // Ferme le modal après soumission
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Modifier la Formation</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="schoolName"
            value={updatedEducation.schoolName}
            onChange={handleChange}
            placeholder="Nom de l'école"
            required
          />
          <input
            type="text"
            name="degree"
            value={updatedEducation.degree}
            onChange={handleChange}
            placeholder="Diplôme"
            required
          />
          <input
            type="text"
            name="fieldOfStudy"
            value={updatedEducation.fieldOfStudy}
            onChange={handleChange}
            placeholder="Domaine d'étude"
            required
          />
          <input
            type="date"
            name="startDate"
            value={updatedEducation.startDate}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="endDate"
            value={updatedEducation.endDate}
            onChange={handleChange}
            disabled={updatedEducation.currentlyStudying}
          />
          <label>
            <input
              type="checkbox"
              name="currentlyStudying"
              checked={updatedEducation.currentlyStudying}
              onChange={handleChange}
            />
            Actuellement en cours
          </label>
          <textarea
            name="description"
            value={updatedEducation.description}
            onChange={handleChange}
            placeholder="Description"
          />
          <div className="modal-buttons">
            <button type="submit" className="update-btn">Mettre à jour</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEducation;
