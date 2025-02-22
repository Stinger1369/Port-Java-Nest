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

  const [updatedRecommendation, setUpdatedRecommendation] = useState({
    id: recommendation.id,
    recommenderName: recommendation.recommenderName || "",
    recommenderPosition: recommendation.recommenderPosition || "",
    recommendationText: recommendation.recommendationText || "",
    dateReceived: recommendation.dateReceived || new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (recommendation) {
      setUpdatedRecommendation({
        id: recommendation.id,
        recommenderName: recommendation.recommenderName || "",
        recommenderPosition: recommendation.recommenderPosition || "",
        recommendationText: recommendation.recommendationText || "",
        dateReceived: recommendation.dateReceived || new Date().toISOString().split("T")[0],
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateRecommendation({ id: updatedRecommendation.id, recommendationData: updatedRecommendation }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier la Recommandation</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="recommenderName" value={updatedRecommendation.recommenderName} onChange={handleChange} required />
          <input type="text" name="recommenderPosition" value={updatedRecommendation.recommenderPosition} onChange={handleChange} />
          <textarea name="recommendationText" value={updatedRecommendation.recommendationText} onChange={handleChange} required />
          <input type="date" name="dateReceived" value={updatedRecommendation.dateReceived} onChange={handleChange} required />
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateRecommendation;
