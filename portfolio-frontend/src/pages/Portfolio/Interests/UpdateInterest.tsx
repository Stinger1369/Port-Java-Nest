import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateInterest, fetchInterestsByUser } from "../../../redux/features/interestSlice";
import { fetchPortfolioByUser } from "../../../redux/features/portfolioSlice";

interface Props {
  interest: {
    id: string;
    name?: string;
    isPublic?: boolean; // Utilisé isPublic pour correspondre au backend
  };
  onClose: () => void;
  onUpdate: (interest: { id: string; name: string }) => void;
}

const UpdateInterest = ({ interest, onClose, onUpdate }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedInterest, setUpdatedInterest] = useState({
    id: interest.id,
    name: interest.name || "",
    isPublic: interest.isPublic || false, // Utilisé isPublic
  });

  useEffect(() => {
    if (interest) {
      setUpdatedInterest({
        id: interest.id,
        name: interest.name || "",
        isPublic: interest.isPublic || false, // Utilisé isPublic
      });
    }
  }, [interest]);

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
            isPublic: updatedInterest.isPublic, // Utilisé isPublic
          },
        })
      )
        .unwrap()
        .then((updated) => {
          onUpdate({ id: updatedInterest.id, name: updatedInterest.name });
          dispatch(fetchInterestsByUser(userId)); // Rafraîchir les intérêts
          dispatch(fetchPortfolioByUser(userId)); // Rafraîchir le portfolio
          onClose();
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de l'intérêt:", err);
          alert("Erreur lors de la mise à jour de l'intérêt.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier le Centre d’Intérêt</h3>
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
              name="isPublic" // Utilisé isPublic
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