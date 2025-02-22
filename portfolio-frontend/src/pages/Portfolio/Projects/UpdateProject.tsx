import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateProject } from "../../../redux/features/projectSlice";

interface Props {
  project: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    link?: string;
    repository?: string;
    startDate: string;
    endDate?: string;
    currentlyWorking: boolean;
  };
  onClose: () => void;
}

const UpdateProject = ({ project, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedProject, setUpdatedProject] = useState(project);

  useEffect(() => {
    setUpdatedProject(project);
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedProject((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateProject({ id: updatedProject.id, projectData: updatedProject }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier le Projet</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" value={updatedProject.title} onChange={handleChange} required />
          <textarea name="description" value={updatedProject.description} onChange={handleChange} />
          <input type="text" name="technologies" value={updatedProject.technologies.join(", ")} onChange={handleChange} />
          <input type="text" name="link" value={updatedProject.link} onChange={handleChange} />
          <input type="text" name="repository" value={updatedProject.repository} onChange={handleChange} />
          <input type="date" name="startDate" value={updatedProject.startDate} onChange={handleChange} required />
          <input type="date" name="endDate" value={updatedProject.endDate} onChange={handleChange} disabled={updatedProject.currentlyWorking} />
          <label>
            <input type="checkbox" name="currentlyWorking" checked={updatedProject.currentlyWorking} onChange={handleChange} />
            Projet en cours
          </label>
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProject;
