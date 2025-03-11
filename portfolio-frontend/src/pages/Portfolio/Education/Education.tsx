import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchEducationsByUser, deleteEducation, updateEducation } from "../../../redux/features/educationSlice";
import AddEducation from "./AddEducation/AddEducation";
import UpdateEducation from "./UpdateEducation/UpdateEducation";
import "./Education.css";

const Education = () => {
  const dispatch = useDispatch<AppDispatch>();
  const educations = useSelector((state: RootState) => state.education.educations) || [];
  const status = useSelector((state: RootState) => state.education.status);
  const error = useSelector((state: RootState) => state.education.error);
  const userId = useSelector((state: RootState) => state.auth.userId); // Utilisation de Redux au lieu de localStorage

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchEducationsByUser(userId));
    }
  }, [dispatch, userId]);

  const sortedEducations = [...educations].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const handleTogglePublic = (educationId: string) => {
    const education = educations.find((edu) => edu.id === educationId);
    if (education && userId) {
      dispatch(
        updateEducation({
          id: educationId,
          educationData: {
            schoolName: education.schoolName,
            degree: education.degree,
            fieldOfStudy: education.fieldOfStudy,
            startDate: education.startDate,
            endDate: education.endDate,
            currentlyStudying: education.currentlyStudying,
            description: education.description,
            isPublic: !education.isPublic,
          },
        })
      )
        .unwrap()
        .then(() => {
          dispatch(fetchEducationsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la visibilité de l'éducation:", err);
          alert("Erreur lors de la mise à jour de la visibilité de l'éducation.");
        });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette formation ?")) {
      dispatch(deleteEducation(id))
        .unwrap()
        .then(() => {
          dispatch(fetchEducationsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de l'éducation:", err);
          alert("Erreur lors de la suppression de l'éducation.");
        });
    }
  };

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
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={edu.isPublic || false}
                    onChange={() => handleTogglePublic(edu.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedEducation(edu)}>✏️</button>
                <button className="delete-button" onClick={() => handleDelete(edu.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-education-text">Aucune formation enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddEducation onClose={() => setShowAddForm(false)} />}
      {selectedEducation && <UpdateEducation education={selectedEducation} onClose={() => setSelectedEducation(null)} />}
    </div>
  );
};

export default Education;