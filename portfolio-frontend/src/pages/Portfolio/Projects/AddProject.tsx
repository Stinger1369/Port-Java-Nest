import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addProject, fetchProjectsByUser } from "../../../redux/features/projectSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Projects.css";

interface Props {
  onClose: () => void;
}

const AddProject = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [project, setProject] = useState({
    title: "",
    description: "",
    technologies: "",
    liveDemoUrl: "",
    repositoryUrl: "",
    startDate: "",
    endDate: "",
    currentlyWorkingOn: false,
    isPublic: false, // Ajouté
  });

  const [error, setError] = useState<string | null>(null);
  const [displayStartDate, setDisplayStartDate] = useState("");
  const [displayEndDate, setDisplayEndDate] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleDateChange = (name: string, value: string) => {
    console.log(`AddProject - ${name} updated to: ${value}, displayStartDate: ${displayStartDate}, displayEndDate: ${displayEndDate}`);
    if (name === "startDate") {
      setDisplayStartDate(value);
    } else if (name === "endDate") {
      setDisplayEndDate(value);
    }

    setProject((prev) => {
      const updatedProject = { ...prev, [name]: value };
      if (name === "endDate" && value && updatedProject.startDate) {
        const start = new Date(updatedProject.startDate);
        const end = new Date(value);
        if (end < start) {
          setError("La date de fin ne peut pas être antérieure à la date de début.");
          return prev;
        }
      }
      setError(null);
      return updatedProject;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("ID utilisateur manquant. Veuillez vous reconnecter.");
      return;
    }

    if (!project.startDate) {
      setError("La date de début est requise.");
      return;
    }

    if (!project.currentlyWorkingOn && !project.endDate) {
      setError("La date de fin est requise si le projet n'est pas en cours.");
      return;
    }

    dispatch(addProject({
      ...project,
      technologies: project.technologies.split(",").map((tech) => tech.trim()),
      userId,
    }))
      .unwrap()
      .then(() => {
        dispatch(fetchProjectsByUser(userId));
        onClose();
      })
      .catch((err) => {
        setError("Erreur lors de l'ajout du projet. Veuillez réessayer.");
        console.error(err);
      });
  };

  return (
    <div className="modal">
      <div className="project-form-container">
        <h3 className="project-form-title">Ajouter un Projet</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={project.title}
            onChange={handleChange}
            placeholder="Titre du projet"
            required
            className="project-input"
          />
          <textarea
            name="description"
            value={project.description}
            onChange={handleChange}
            placeholder="Description"
            className="project-textarea"
          />
          <input
            type="text"
            name="technologies"
            value={project.technologies}
            onChange={handleChange}
            placeholder="Technologies (séparées par des virgules)"
            className="project-input"
          />
          <input
            type="text"
            name="liveDemoUrl"
            value={project.liveDemoUrl}
            onChange={handleChange}
            placeholder="Lien du projet (optionnel)"
            className="project-input"
          />
          <input
            type="text"
            name="repositoryUrl"
            value={project.repositoryUrl}
            onChange={handleChange}
            placeholder="Lien du code source (optionnel)"
            className="project-input"
          />
          <DatePicker
            name="startDate"
            value={displayStartDate}
            onChange={handleDateChange}
            label="Date de début"
            required
            className="project-date-picker"
          />
          <DatePicker
            name="endDate"
            value={displayEndDate}
            onChange={handleDateChange}
            label="Date de fin"
            disabled={project.currentlyWorkingOn}
            minDate={project.startDate}
            className="project-date-picker"
          />
          <label className="project-checkbox-label">
            <input
              type="checkbox"
              name="currentlyWorkingOn"
              checked={project.currentlyWorkingOn}
              onChange={handleChange}
            />
            Projet en cours
          </label>
          <label className="project-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={project.isPublic}
              onChange={handleChange}
            />
            Public
          </label>
          {error && <p className="project-error-message">{error}</p>}
          <button type="submit" className="project-button project-button-submit">Ajouter</button>
          <button type="button" className="project-button project-button-cancel" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddProject;