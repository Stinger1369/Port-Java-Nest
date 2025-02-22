import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchSkillsByUser, deleteSkill } from "../../../redux/features/skillSlice";
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
                <button className="edit-button" onClick={() => setSelectedSkill(skill)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteSkill(skill.id))}>🗑️</button>
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
