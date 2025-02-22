import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchRecommendationsByUser, deleteRecommendation } from "../../../redux/features/recommendationSlice";
import AddRecommendation from "./AddRecommendation";
import UpdateRecommendation from "./UpdateRecommendation";
import "./Recommendations.css";

const Recommendations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations) || [];
  const status = useSelector((state: RootState) => state.recommendation.status);
  const error = useSelector((state: RootState) => state.recommendation.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchRecommendationsByUser(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="recommendations-container">
      <h2>Recommandations</h2>

      {status === "loading" && <p className="loading-text">Chargement des recommandations...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {recommendations.length > 0 ? (
        <ul className="recommendations-list">
          {recommendations.map((rec) => (
            <li key={rec.id} className="recommendation-item">
              <div className="recommendation-info">
                <strong>{rec.recommenderName}</strong> - {rec.recommenderPosition}
                <p>"{rec.recommendationText}"</p>
                <p className="date-received">{rec.dateReceived}</p>
                <button className="edit-button" onClick={() => setSelectedRecommendation(rec)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteRecommendation(rec.id))}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-recommendations-text">Aucune recommandation enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddRecommendation onClose={() => setShowAddForm(false)} />}
      {selectedRecommendation && <UpdateRecommendation recommendation={selectedRecommendation} onClose={() => setSelectedRecommendation(null)} />}
    </div>
  );
};

export default Recommendations;
