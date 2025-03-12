import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchExperiencesByUser, deleteExperience, updateExperience } from "../../../redux/features/experienceSlice";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [experienceIdToDelete, setExperienceIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchExperiencesByUser(userId));
    }
  }, [dispatch, userId]);

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

  const handleTogglePublic = (experienceId: string) => {
    const experience = experiences.find((exp) => exp.id === experienceId);
    if (experience && userId) {
      dispatch(
        updateExperience({
          id: experienceId,
          experienceData: {
            companyName: experience.companyName,
            position: experience.position,
            startDate: experience.startDate,
            endDate: experience.endDate,
            currentlyWorking: experience.currentlyWorking,
            description: experience.description,
            isPublic: !experience.isPublic,
          },
        })
      )
        .unwrap()
        .then(() => {
          setSuccessMessage("Visibilité de l’expérience mise à jour avec succès !");
          dispatch(fetchExperiencesByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la visibilité de l'expérience:", err);
          setErrorMessage("Erreur lors de la mise à jour de la visibilité de l’expérience.");
        });
    }
  };

  const handleDeleteExperience = (experienceId: string) => {
    setExperienceIdToDelete(experienceId);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (experienceIdToDelete && userId) {
      dispatch(deleteExperience(experienceIdToDelete))
        .unwrap()
        .then(() => {
          setSuccessMessage("Expérience supprimée avec succès !");
          dispatch(fetchExperiencesByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de l'expérience:", err);
          setErrorMessage("Erreur lors de la suppression de l’expérience.");
        });
    }
    setShowConfirmModal(false);
    setExperienceIdToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setExperienceIdToDelete(null);
  };

  return (
    <div className="experience-container">
      <h2>Expériences Professionnelles</h2>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {status === "loading" && <p className="loading-text">Chargement des expériences...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {experiences.length > 0 ? (
        <ul className="experience-list">
          {experiences.map((exp) => (
            <li key={exp.id} className="experience-item">
              <div className="experience-info">
                <strong>{exp.companyName}</strong> - {exp.jobTitle}
                <p>{exp.startDate} - {exp.endDate || "Actuellement en poste"}</p>
                <p>{exp.description}</p>
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={exp.isPublic || false}
                    onChange={() => handleTogglePublic(exp.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedExperience(exp)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteExperience(exp.id)}>🗑️</button>
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

      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer cette expérience ?</p>
            <div className="confirm-modal-actions">
              <button className="confirm-button" onClick={confirmDelete}>Oui</button>
              <button className="cancel-button" onClick={cancelDelete}>Non</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experience;