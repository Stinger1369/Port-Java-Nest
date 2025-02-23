import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchRecommendationsByUser, deleteRecommendation } from "../../../redux/features/recommendationSlice";
import AddRecommendation from "./AddRecommendation";
import UpdateRecommendation from "./UpdateRecommendation";
import "./Recommendations.css";

// ✅ **Alignement avec le backend (RecommendationDTO)**
interface Recommendation {
  id: string;
  userId: string;
  recommenderId: string;
  content: string;
  createdAt: string; // Format YYYY-MM-DD
}

const Recommendations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations) || [];
  const status = useSelector((state: RootState) => state.recommendation.status);
  const error = useSelector((state: RootState) => state.recommendation.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      dispatch(fetchRecommendationsByUser(userId));
    }
  }, [dispatch, userId]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await dispatch(deleteRecommendation(id)).unwrap();
      console.log(`✅ Recommandation supprimée : ID ${id}`);
    } catch (error) {
      console.error("❌ Erreur lors de la suppression :", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="recommendations-container">
      <h2>Recommandations</h2>

      {status === "loading" && <p className="loading-text">⏳ Chargement des recommandations...</p>}
      {status === "failed" && <p className="error-text">❌ Erreur : {error}</p>}

      {recommendations.length > 0 ? (
        <ul className="recommendations-list">
          {recommendations.map((rec) => (
            <li key={rec.id} className="recommendation-item">
              <div className="recommendation-info">
                <strong>Recommendeur ID : {rec.recommenderId}</strong>
                <p>"{rec.content}"</p>
                <p className="date-received">📅 {rec.createdAt}</p>
                <button className="edit-button" onClick={() => setSelectedRecommendation(rec)} disabled={isDeleting}>✏️</button>
                <button className="delete-button" onClick={() => handleDelete(rec.id)} disabled={isDeleting}>
                  {isDeleting ? "Suppression..." : "🗑️"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        status !== "loading" && <p className="no-recommendations-text">📭 Aucune recommandation enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddRecommendation onClose={() => setShowAddForm(false)} />}
      {selectedRecommendation && (
        <UpdateRecommendation
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
        />
      )}
    </div>
  );
};

export default Recommendations;
