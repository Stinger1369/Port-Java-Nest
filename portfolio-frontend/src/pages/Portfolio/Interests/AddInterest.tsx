import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addInterest, fetchInterestsByUser } from "../../../redux/features/interestSlice";
import { fetchPortfolioByUser } from "../../../redux/features/portfolioSlice";

interface Props {
  onClose: () => void;
  onAdd: (interest: { id: string; name: string }) => void;
}

const AddInterest = ({ onClose, onAdd }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [interest, setInterest] = useState({
    name: "",
    isPublic: false, // Changé de public à isPublic
  });

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
      return;
    }

    // Appeler l'API pour ajouter un nouvel intérêt
    dispatch(addInterest({ name: interest.name, description: "", isPublic: interest.isPublic })) // Utilisé isPublic
      .unwrap()
      .then((newInterest) => {
        onAdd({ id: newInterest.id, name: newInterest.name });
        dispatch(fetchInterestsByUser(userId)); // Rafraîchir les intérêts
        dispatch(fetchPortfolioByUser(userId)); // Rafraîchir le portfolio
        onClose();
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de l'intérêt:", err);
        alert("Erreur lors de l'ajout de l'intérêt.");
      });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter un Centre d’Intérêt</h3>
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
            <input type="checkbox" name="isPublic" checked={interest.isPublic} onChange={handleChange} /> {/* Utilisé isPublic */}
          </label>
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddInterest;