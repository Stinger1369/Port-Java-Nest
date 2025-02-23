import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateRecommendation } from "../../../redux/features/recommendationSlice";

// ✅ **Alignement avec le backend (RecommendationDTO)**
interface Recommendation {
  id: string;
  userId: string;
  recommenderId: string;
  content: string;
  createdAt: string;
}

interface Props {
  recommendation?: Recommendation; // ✅ Peut être undefined au début
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
      : new Date().toISOString().split("T")[0], // ✅ Format YYYY-MM-DD
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updatedRecommendation.recommenderId.trim() || !updatedRecommendation.content.trim()) {
      console.error("❌ Erreur : Les champs 'ID du recommendeur' et 'Texte de recommandation' sont obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updateRecommendation({ id: updatedRecommendation.id, recommendationData: updatedRecommendation })).unwrap();
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
      <div className="modal-content">
        <h3>Modifier la Recommandation</h3>
        <form onSubmit={handleSubmit}>
          <label>ID de l'utilisateur *</label>
          <input
            type="text"
            name="userId"
            value={updatedRecommendation.userId}
            onChange={handleChange}
            required
          />

          <label>ID du recommendeur *</label>
          <input
            type="text"
            name="recommenderId"
            value={updatedRecommendation.recommenderId}
            onChange={handleChange}
            required
          />

          <label>Texte de recommandation *</label>
          <textarea
            name="content"
            value={updatedRecommendation.content}
            onChange={handleChange}
            required
          />

          <label>Date de création *</label>
          <input
            type="date"
            name="createdAt"
            value={updatedRecommendation.createdAt}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mise à jour en cours..." : "Mettre à jour"}
          </button>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateRecommendation;
