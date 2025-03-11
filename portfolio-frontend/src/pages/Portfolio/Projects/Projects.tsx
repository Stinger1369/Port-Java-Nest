import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchProjectsByUser, deleteProject, updateProject } from "../../../redux/features/projectSlice";
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

  const handleTogglePublic = (projectId: string) => {
    const project = projects.find((proj) => proj.id === projectId);
    if (project && userId) {
      dispatch(
        updateProject({
          id: projectId,
          projectData: {
            title: project.title,
            description: project.description,
            technologies: project.technologies,
            liveDemoUrl: project.liveDemoUrl,
            repositoryUrl: project.repositoryUrl,
            startDate: project.startDate,
            endDate: project.endDate,
            currentlyWorkingOn: project.currentlyWorkingOn,
            isPublic: !project.isPublic,
          },
        })
      )
        .unwrap()
        .then(() => {
          dispatch(fetchProjectsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la visibilité du projet:", err);
          alert("Erreur lors de la mise à jour de la visibilité du projet.");
        });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (userId) {
      dispatch(deleteProject(projectId))
        .unwrap()
        .then(() => {
          dispatch(fetchProjectsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression du projet:", err);
          alert("Erreur lors de la suppression du projet.");
        });
    }
  };

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
                {project.liveDemoUrl && (
                  <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer">
                    🔗 Voir le projet
                  </a>
                )}
                {project.repositoryUrl && (
                  <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                    📁 Code source
                  </a>
                )}
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={project.isPublic || false}
                    onChange={() => handleTogglePublic(project.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedProject(project)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteProject(project.id)}>🗑️</button>
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