import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchProjectsByUser, deleteProject } from "../../../redux/features/projectSlice";
import AddProject from "./AddProject";
import UpdateProject from "./UpdateProject";
import "./Projects.css";

const Projects = () => {
  const dispatch = useDispatch<AppDispatch>();
  const projects = useSelector((state: RootState) => state.project.projects) || [];
  const status = useSelector((state: RootState) => state.project.status);
  const error = useSelector((state: RootState) => state.project.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchProjectsByUser(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="projects-container">
      <h2>Projets Réalisés</h2>

      {status === "loading" && <p className="loading-text">Chargement des projets...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {projects.length > 0 ? (
        <ul className="projects-list">
          {projects.map((project) => (
            <li key={project.id} className="project-item">
              <div className="project-info">
                <strong>{project.title}</strong> - {project.startDate} à {project.endDate || "En cours"}
                <p>{project.description}</p>
                <p>Technologies: {project.technologies.join(", ")}</p>
                {project.link && <a href={project.link} target="_blank" rel="noopener noreferrer">🔗 Voir le projet</a>}
                {project.repository && <a href={project.repository} target="_blank" rel="noopener noreferrer">📁 Code source</a>}
                <button className="edit-button" onClick={() => setSelectedProject(project)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteProject(project.id))}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-projects-text">Aucun projet enregistré.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddProject onClose={() => setShowAddForm(false)} />}
      {selectedProject && <UpdateProject project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </div>
  );
};

export default Projects;
