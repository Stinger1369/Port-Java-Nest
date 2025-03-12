import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addInterest, fetchInterestsByUser } from "../../../redux/features/interestSlice";
import { fetchPortfolioByUser } from "../../../redux/features/portfolioSlice";
import "./Interest.css";

interface Props {
  onClose: () => void;
  onAdd: (interest: { id: string; name: string }) => void;
}

const AddInterest = ({ onClose, onAdd }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [interest, setInterest] = useState({
    name: "",
    isPublic: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setInterest((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      setErrorMessage("Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addInterest({ name: interest.name, description: "", isPublic: interest.isPublic }))
      .unwrap()
      .then((newInterest) => {
        setSuccessMessage("Centre d’intérêt ajouté avec succès !");
        onAdd({ id: newInterest.id, name: newInterest.name });
        dispatch(fetchInterestsByUser(userId));
        dispatch(fetchPortfolioByUser(userId));
        setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de l'intérêt:", err);
        setErrorMessage("Erreur lors de l’ajout de l’intérêt.");
      });
  };

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

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter un Centre d’Intérêt</h3>
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
            value={interest.name}
            onChange={handleChange}
            placeholder="Nom du centre d’intérêt"
            required
          />
          <label>
            Public :
            <input type="checkbox" name="isPublic" checked={interest.isPublic} onChange={handleChange} />
          </label>
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddInterest;