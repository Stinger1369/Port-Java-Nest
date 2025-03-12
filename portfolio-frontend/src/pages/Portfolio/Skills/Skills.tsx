import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchSkillsByUser, deleteSkill, updateSkill } from "../../../redux/features/skillSlice";
import AddSkill from "./AddSkill";
import UpdateSkill from "./UpdateSkill";
import "./Skills.css";

const Skills = () => {
  const dispatch = useDispatch<AppDispatch>();
  const skills = useSelector((state: RootState) => state.skill.skills) || [];
  const status = useSelector((state: RootState) => state.skill.status);
  const error = useSelector((state: RootState) => state.skill.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [skillIdToDelete, setSkillIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchSkillsByUser(userId));
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

  const handleTogglePublic = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (skill && userId) {
      dispatch(
        updateSkill({
          id: skillId,
          skillData: {
            name: skill.name,
            level: skill.level,
            description: skill.description,
            isPublic: !skill.isPublic,
          },
        })
      )
        .unwrap()
        .then(() => {
          setSuccessMessage("Visibilité de la compétence mise à jour avec succès !");
          dispatch(fetchSkillsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la visibilité de la compétence:", err);
          setErrorMessage("Erreur lors de la mise à jour de la visibilité de la compétence.");
        });
    }
  };

  const handleDeleteSkill = (skillId: string) => {
    setSkillIdToDelete(skillId);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (skillIdToDelete && userId) {
      dispatch(deleteSkill(skillIdToDelete))
        .unwrap()
        .then(() => {
          setSuccessMessage("Compétence supprimée avec succès !");
          dispatch(fetchSkillsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de la compétence:", err);
          setErrorMessage("Erreur lors de la suppression de la compétence.");
        });
    }
    setShowConfirmModal(false);
    setSkillIdToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setSkillIdToDelete(null);
  };

  return (
    <div className="skills-container">
      <h2>Compétences</h2>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {status === "loading" && <p className="loading-text">Chargement des compétences...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {skills.length > 0 ? (
        <ul className="skills-list">
          {skills.map((skill) => (
            <li key={skill.id} className="skill-item">
              <div className="skill-info">
                <strong>{skill.name}</strong> - Niveau : {skill.level}%
                <p>{skill.description}</p>
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={skill.isPublic || false}
                    onChange={() => handleTogglePublic(skill.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedSkill(skill)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteSkill(skill.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-skills-text">Aucune compétence enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddSkill onClose={() => setShowAddForm(false)} />}
      {selectedSkill && <UpdateSkill skill={selectedSkill} onClose={() => setSelectedSkill(null)} />}

      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer cette compétence ?</p>
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

export default Skills;