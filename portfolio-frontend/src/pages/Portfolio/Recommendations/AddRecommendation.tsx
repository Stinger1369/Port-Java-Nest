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
    recommenderName: "",
    recommenderPosition: "",
    recommendationText: "",
    dateReceived: new Date().toISOString().split("T")[0],
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

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    if (!recommendation.recommenderName.trim() || !recommendation.recommendationText.trim()) {
      console.error("❌ Erreur : Les champs 'Nom du recommendeur' et 'Texte de recommandation' sont obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(addRecommendation({ ...recommendation, userId })).unwrap();
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
          <input
            type="text"
            name="recommenderName"
            value={recommendation.recommenderName}
            onChange={handleChange}
            placeholder="Nom du recommendeur"
            required
          />
          <input
            type="text"
            name="recommenderPosition"
            value={recommendation.recommenderPosition}
            onChange={handleChange}
            placeholder="Poste du recommendeur"
          />
          <textarea
            name="recommendationText"
            value={recommendation.recommendationText}
            onChange={handleChange}
            placeholder="Texte de recommandation"
            required
          />
          <input type="date" name="dateReceived" value={recommendation.dateReceived} onChange={handleChange} required />

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
