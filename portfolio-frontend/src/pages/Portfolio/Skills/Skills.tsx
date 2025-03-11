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

  useEffect(() => {
    if (userId) {
      dispatch(fetchSkillsByUser(userId));
    }
  }, [dispatch, userId]);

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
          dispatch(fetchSkillsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la visibilité de la compétence:", err);
          alert("Erreur lors de la mise à jour de la visibilité de la compétence.");
        });
    }
  };

  const handleDeleteSkill = (skillId: string) => {
    if (userId) {
      dispatch(deleteSkill(skillId))
        .unwrap()
        .then(() => {
          dispatch(fetchSkillsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de la compétence:", err);
          alert("Erreur lors de la suppression de la compétence.");
        });
    }
  };

  return (
    <div className="skills-container">
      <h2>Compétences</h2>

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
    </div>
  );
};

export default Skills;