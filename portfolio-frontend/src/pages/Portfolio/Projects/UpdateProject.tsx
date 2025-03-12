import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateProject, fetchProjectsByUser } from "../../../redux/features/projectSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Projects.css";

interface Props {
  project: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    liveDemoUrl?: string;
    repositoryUrl?: string;
    startDate: string;
    endDate?: string;
    currentlyWorkingOn: boolean;
    isPublic?: boolean;
  };
  onClose: () => void;
}

const UpdateProject = ({ project, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedProject, setUpdatedProject] = useState(project);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setUpdatedProject(project);
  }, [project]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedProject((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleDateChange = (name: string, value: string) => {
    setUpdatedProject((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "endDate" && value && updated.startDate) {
        const start = new Date(updated.startDate);
        const end = new Date(value);
        if (end < start) {
          setError("La date de fin ne peut pas être antérieure à la date de début.");
          return prev;
        }
      }
      setError(null);
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatedProject.startDate) {
      setError("La date de début est requise.");
      return;
    }
    if (!updatedProject.currentlyWorkingOn && !updatedProject.endDate) {
      setError("La date de fin est requise si le projet n'est pas en cours.");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(updateProject({
        id: updatedProject.id,
        projectData: {
          ...updatedProject,
          technologies: updatedProject.technologies, // Already an array, no need to split
        }
      }))
        .unwrap()
        .then(() => {
          setSuccessMessage("Projet mis à jour avec succès !");
          dispatch(fetchProjectsByUser(userId));
          setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
        })
        .catch((err) => {
          setError("Erreur lors de la mise à jour du projet. Veuillez réessayer.");
          console.error(err);
        });
    }
  };

  return (
    <div className="modal">
      <div className="project-form-container">
        <h3 className="project-form-title">Modifier le Projet</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {error && <p className="project-error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={updatedProject.title}
            onChange={handleChange}
            required
            className="project-input"
          />
          <textarea
            name="description"
            value={updatedProject.description}
            onChange={handleChange}
            className="project-textarea"
          />
          <input
            type="text"
            name="technologies"
            value={updatedProject.technologies.join(", ")}
            onChange={handleChange}
            className="project-input"
          />
          <input
            type="text"
            name="liveDemoUrl"
            value={updatedProject.liveDemoUrl || ""}
            onChange={handleChange}
            className="project-input"
          />
          <input
            type="text"
            name="repositoryUrl"
            value={updatedProject.repositoryUrl || ""}
            onChange={handleChange}
            className="project-input"
          />
          <DatePicker
            name="startDate"
            value={updatedProject.startDate}
            onChange={handleDateChange}
            label="Date de début"
            required
            className="project-date-picker"
          />
          <DatePicker
            name="endDate"
            value={updatedProject.endDate || ""}
            onChange={handleDateChange}
            label="Date de fin"
            disabled={updatedProject.currentlyWorkingOn}
            minDate={updatedProject.startDate}
            className="project-date-picker"
          />
          <label className="project-checkbox-label">
            <input
              type="checkbox"
              name="currentlyWorkingOn"
              checked={updatedProject.currentlyWorkingOn}
              onChange={handleChange}
            />
            Projet en cours
          </label>
          <label className="project-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedProject.isPublic || false}
              onChange={handleChange}
            />
            Public
          </label>
          <button type="submit" className="project-button project-button-submit">Mettre à jour</button>
          <button type="button" className="project-button project-button-cancel" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProject;