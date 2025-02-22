import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateRecommendation } from "../../../redux/features/recommendationSlice";

interface Props {
  recommendation: {
    id: string;
    recommenderName?: string;
    recommenderPosition?: string;
    recommendationText?: string;
    dateReceived?: string;
  };
  onClose: () => void;
}

const UpdateRecommendation = ({ recommendation, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updatedRecommendation, setUpdatedRecommendation] = useState({
    id: recommendation.id,
    recommenderName: recommendation.recommenderName || "",
    recommenderPosition: recommendation.recommenderPosition || "",
    recommendationText: recommendation.recommendationText || "",
    dateReceived: recommendation.dateReceived
      ? recommendation.dateReceived.split("T")[0] // ✅ Correction du format date
      : new Date().toISOString().split("T")[0], // Par défaut, date du jour
  });

  useEffect(() => {
    if (recommendation) {
      setUpdatedRecommendation({
        id: recommendation.id,
        recommenderName: recommendation.recommenderName || "",
        recommenderPosition: recommendation.recommenderPosition || "",
        recommendationText: recommendation.recommendationText || "",
        dateReceived: recommendation.dateReceived
          ? recommendation.dateReceived.split("T")[0]
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

    // ✅ Vérification des champs obligatoires avant l'envoi
    if (!updatedRecommendation.recommenderName.trim() || !updatedRecommendation.recommendationText.trim()) {
      console.error("❌ Erreur : Les champs 'Nom du recommendeur' et 'Texte de recommandation' sont obligatoires.");
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

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier la Recommandation</h3>
        <form onSubmit={handleSubmit}>
          <label>Nom du recommendeur *</label>
          <input
            type="text"
            name="recommenderName"
            value={updatedRecommendation.recommenderName}
            onChange={handleChange}
            required
          />

          <label>Poste du recommendeur</label>
          <input
            type="text"
            name="recommenderPosition"
            value={updatedRecommendation.recommenderPosition}
            onChange={handleChange}
          />

          <label>Texte de recommandation *</label>
          <textarea
            name="recommendationText"
            value={updatedRecommendation.recommendationText}
            onChange={handleChange}
            required
          />

          <label>Date de réception *</label>
          <input
            type="date"
            name="dateReceived"
            value={updatedRecommendation.dateReceived}
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
