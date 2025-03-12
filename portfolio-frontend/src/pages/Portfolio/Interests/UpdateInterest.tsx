import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateInterest, fetchInterestsByUser } from "../../../redux/features/interestSlice";
import { fetchPortfolioByUser } from "../../../redux/features/portfolioSlice";
import "./Interest.css";

interface Props {
  interest: {
    id: string;
    name?: string;
    isPublic?: boolean;
  };
  onClose: () => void;
  onUpdate: (interest: { id: string; name: string }) => void;
}

const UpdateInterest = ({ interest, onClose, onUpdate }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedInterest, setUpdatedInterest] = useState({
    id: interest.id,
    name: interest.name || "",
    isPublic: interest.isPublic || false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (interest) {
      setUpdatedInterest({
        id: interest.id,
        name: interest.name || "",
        isPublic: interest.isPublic || false,
      });
    }
  }, [interest]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedInterest((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(
        updateInterest({
          id: updatedInterest.id,
          interestData: {
            name: updatedInterest.name,
            isPublic: updatedInterest.isPublic,
          },
        })
      )
        .unwrap()
        .then((updated) => {
          setSuccessMessage("Centre d’intérêt mis à jour avec succès !");
          onUpdate({ id: updatedInterest.id, name: updatedInterest.name });
          dispatch(fetchInterestsByUser(userId));
          dispatch(fetchPortfolioByUser(userId));
          setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de l'intérêt:", err);
          setErrorMessage("Erreur lors de la mise à jour de l’intérêt.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier le Centre d’Intérêt</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={updatedInterest.name}
            onChange={handleChange}
            required
          />
          <label>
            Public :
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedInterest.isPublic}
              onChange={handleChange}
            />
          </label>
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateInterest;