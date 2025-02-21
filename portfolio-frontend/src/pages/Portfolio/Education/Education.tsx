import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchEducationsByUser } from "../../../redux/features/educationSlice";
import AddEducation from "./AddEducation/AddEducation";
import UpdateEducation from "./UpdateEducation/UpdateEducation";
import "./Education.css"; // ✅ Import du CSS

const Education = () => {
  const dispatch = useDispatch<AppDispatch>();
  const educations = useSelector((state: RootState) => state.education.educations) || [];
  const status = useSelector((state: RootState) => state.education.status);
  const error = useSelector((state: RootState) => state.education.error);
  const userId = useSelector((state: RootState) => state.auth.userId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchEducationsByUser(userId));
    }
  }, [dispatch, userId]);

  // ✅ Trier les formations par date (les plus récentes en haut)
  const sortedEducations = [...educations].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="education-container">
      <h2>Éducation</h2>

      {status === "loading" && <p className="loading-text">Chargement des formations...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {sortedEducations.length > 0 ? (
        <ul className="education-list">
          {sortedEducations.map((edu) => (
            <li key={edu.id} className="education-item">
              <div className="education-info">
                <strong>{edu.schoolName}</strong> - {edu.degree} ({edu.fieldOfStudy})
                <p>{edu.startDate} - {edu.endDate || "En cours"}</p>
                <p>{edu.description}</p>
                {/* ✅ Icône d'édition */}
                <button className="edit-button" onClick={() => setSelectedEducation(edu)}>✏️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-education-text">Aucune formation enregistrée.</p>
      )}

      {/* Bouton pour ajouter une formation */}
      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {/* Afficher le modal d'ajout */}
      {showAddForm && <AddEducation onClose={() => setShowAddForm(false)} />}

      {/* Afficher le modal d'édition */}
      {selectedEducation && <UpdateEducation education={selectedEducation} onClose={() => setSelectedEducation(null)} />}
    </div>
  );
};

export default Education;
