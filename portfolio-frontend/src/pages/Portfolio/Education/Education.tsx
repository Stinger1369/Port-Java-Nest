import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchEducationsByUser } from "../../../redux/features/educationSlice";

const Education = () => {
  const dispatch = useDispatch<AppDispatch>();
  const educations = useSelector((state: RootState) => state.education.educations) || [];
  const status = useSelector((state: RootState) => state.education.status);
  const error = useSelector((state: RootState) => state.education.error);
  const userId = useSelector((state: RootState) => state.auth.userId); // ✅ Assurez-vous que cet ID est correct

  useEffect(() => {
    if (userId) {
      console.log("🔄 Dispatch fetchEducationsByUser pour l'utilisateur :", userId);
      dispatch(fetchEducationsByUser(userId));
    }
  }, [dispatch, userId]);

  console.log("💡 État Redux -> Status :", status);
  console.log("💡 État Redux -> Erreur :", error);
  console.log("💡 État Redux -> Formations :", educations);

  if (status === "loading") return <p>Chargement des formations...</p>;
  if (status === "failed") return <p style={{ color: "red" }}>Erreur : {error}</p>;

  return (
    <div>
      <h2>Éducation</h2>
      {educations.length > 0 ? (
        <ul>
          {educations.map((edu) => (
            <li key={edu.id}>
              <strong>{edu.schoolName}</strong> - {edu.degree} ({edu.fieldOfStudy})
              <p>{edu.startDate} - {edu.endDate || "En cours"}</p>
              <p>{edu.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune formation enregistrée.</p>
      )}
    </div>
  );
};

export default Education;
