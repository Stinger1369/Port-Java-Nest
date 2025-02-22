import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addProject } from "../../../redux/features/projectSlice";

interface Props {
  onClose: () => void;
}

const AddProject = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [project, setProject] = useState({
    title: "",
    description: "",
    technologies: "",
    link: "",
    repository: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addProject({
      ...project,
      technologies: project.technologies.split(",").map((tech) => tech.trim()),
      userId,
    }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter un Projet</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" value={project.title} onChange={handleChange} placeholder="Titre du projet" required />
          <textarea name="description" value={project.description} onChange={handleChange} placeholder="Description" />
          <input type="text" name="technologies" value={project.technologies} onChange={handleChange} placeholder="Technologies (séparées par des virgules)" />
          <input type="text" name="link" value={project.link} onChange={handleChange} placeholder="Lien du projet (optionnel)" />
          <input type="text" name="repository" value={project.repository} onChange={handleChange} placeholder="Lien du code source (optionnel)" />
          <input type="date" name="startDate" value={project.startDate} onChange={handleChange} required />
          <input type="date" name="endDate" value={project.endDate} onChange={handleChange} disabled={project.currentlyWorking} />
          <label>
            <input type="checkbox" name="currentlyWorking" checked={project.currentlyWorking} onChange={handleChange} />
            Projet en cours
          </label>
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
