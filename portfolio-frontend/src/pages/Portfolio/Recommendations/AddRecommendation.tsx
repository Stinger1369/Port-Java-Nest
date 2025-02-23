import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addRecommendation } from "../../../redux/features/recommendationSlice";

interface Props {
  onClose: () => void;
}

const AddRecommendation = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recommendation, setRecommendation] = useState({
    userId: localStorage.getItem("userId") || "", // ✅ Récupération automatique de l'userId
    recommenderId: "",
    content: "",
    createdAt: new Date().toISOString().split("T")[0], // ✅ Format YYYY-MM-DD
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecommendation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recommendation.userId.trim()) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    if (!recommendation.recommenderId.trim() || !recommendation.content.trim()) {
      console.error("❌ Erreur : 'ID du recommendeur' et 'Texte de recommandation' sont obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(addRecommendation(recommendation)).unwrap();
      console.log("✅ Recommandation ajoutée avec succès !");
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter une Recommandation</h3>
        <form onSubmit={handleSubmit}>
          <label>ID de l'utilisateur *</label>
          <input type="text" name="userId" value={recommendation.userId} onChange={handleChange} required readOnly />

          <label>ID du recommendeur *</label>
          <input type="text" name="recommenderId" value={recommendation.recommenderId} onChange={handleChange} required />

          <label>Texte de recommandation *</label>
          <textarea name="content" value={recommendation.content} onChange={handleChange} required />

          <label>Date de création *</label>
          <input type="date" name="createdAt" value={recommendation.createdAt} onChange={handleChange} required />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ajout en cours..." : "Ajouter"}
          </button>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRecommendation;
