import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateRecommendation } from "../../../redux/features/recommendationSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Recommendations.css"; // Importer les styles

// Alignement avec le backend (RecommendationDTO)
interface Recommendation {
  id: string;
  userId: string;
  recommenderId: string;
  content: string;
  createdAt: string;
}

interface Props {
  recommendation?: Recommendation;
  onClose: () => void;
}

const UpdateRecommendation = ({ recommendation, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updatedRecommendation, setUpdatedRecommendation] = useState<Recommendation>({
    id: recommendation?.id || "",
    userId: recommendation?.userId || "",
    recommenderId: recommendation?.recommenderId || "",
    content: recommendation?.content || "",
    createdAt: recommendation?.createdAt
      ? recommendation.createdAt.split("T")[0]
      : new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
  });

  useEffect(() => {
    if (recommendation) {
      setUpdatedRecommendation({
        id: recommendation.id,
        userId: recommendation.userId,
        recommenderId: recommendation.recommenderId,
        content: recommendation.content,
        createdAt: recommendation.createdAt
          ? recommendation.createdAt.split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    }
  }, [recommendation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedRecommendation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setUpdatedRecommendation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updatedRecommendation.recommenderId.trim() || !updatedRecommendation.content.trim()) {
      console.error("❌ Erreur : Les champs 'ID du recommendeur' et 'Texte de recommandation' sont obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(
        updateRecommendation({ id: updatedRecommendation.id, recommendationData: updatedRecommendation })
      ).unwrap();
      console.log("✅ Recommandation mise à jour avec succès !");
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!recommendation) {
    return <p>⏳ Chargement des informations...</p>;
  }

  return (
    <div className="modal">
      <div className="recommendation-form-container">
        <h3 className="recommendation-form-title">Modifier la Recommandation</h3>
        <form onSubmit={handleSubmit}>
          <label className="recommendation-label">ID de l'utilisateur *</label>
          <input
            type="text"
            name="userId"
            value={updatedRecommendation.userId}
            onChange={handleChange}
            required
            className="recommendation-input"
          />

          <label className="recommendation-label">ID du recommendeur *</label>
          <input
            type="text"
            name="recommenderId"
            value={updatedRecommendation.recommenderId}
            onChange={handleChange}
            required
            className="recommendation-input"
          />

          <label className="recommendation-label">Texte de recommandation *</label>
          <textarea
            name="content"
            value={updatedRecommendation.content}
            onChange={handleChange}
            required
            className="recommendation-textarea"
          />

          <label className="recommendation-label">Date de création *</label>
          <DatePicker
            name="createdAt"
            value={updatedRecommendation.createdAt}
            onChange={handleDateChange}
            required
            className="recommendation-date-picker"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="recommendation-button recommendation-button-submit"
          >
            {isSubmitting ? "Mise à jour en cours..." : "Mettre à jour"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="recommendation-button recommendation-button-cancel"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateRecommendation;