import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchExperiencesByUser, deleteExperience } from "../../../redux/features/experienceSlice";
import AddExperience from "./AddExperience";
import UpdateExperience from "./UpdateExperience";
import "./Experience.css";

const Experience = () => {
  const dispatch = useDispatch<AppDispatch>();
  const experiences = useSelector((state: RootState) => state.experience.experiences) || [];
  const status = useSelector((state: RootState) => state.experience.status);
  const error = useSelector((state: RootState) => state.experience.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchExperiencesByUser(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="experience-container">
      <h2>Expériences Professionnelles</h2>

      {status === "loading" && <p className="loading-text">Chargement des expériences...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {experiences.length > 0 ? (
        <ul className="experience-list">
          {experiences.map((exp) => (
            <li key={exp.id} className="experience-item">
              <div className="experience-info">
                <strong>{exp.companyName}</strong> - {exp.position}
                <p>{exp.startDate} - {exp.endDate || "Actuellement en poste"}</p>
                <p>{exp.description}</p>
                <button className="edit-button" onClick={() => setSelectedExperience(exp)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteExperience(exp.id))}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-experience-text">Aucune expérience enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddExperience onClose={() => setShowAddForm(false)} />}
      {selectedExperience && <UpdateExperience experience={selectedExperience} onClose={() => setSelectedExperience(null)} />}
    </div>
  );
};

export default Experience;
