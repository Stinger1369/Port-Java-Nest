import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchInterestsByUser, updateInterest, deleteInterest } from "../../../redux/features/interestSlice";
import { fetchPortfolioByUser } from "../../../redux/features/portfolioSlice";
import AddInterest from "./AddInterest";
import UpdateInterest from "./UpdateInterest";
import "./Interest.css";

const Interest = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { interests, status, error } = useSelector((state: RootState) => state.interest);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<{
    id: string;
    name: string;
    isPublic?: boolean; // Utilisé isPublic
  } | null>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchInterestsByUser(userId));
      dispatch(fetchPortfolioByUser(userId));
    }
  }, [dispatch, userId]);

  const handleUpdateInterest = (updatedInterest: { id: string; name: string }) => {
    setSelectedInterest(null);
  };

  const handleDeleteInterest = (interestId: string) => {
    if (userId) {
      dispatch(deleteInterest(interestId))
        .unwrap()
        .then(() => {
          dispatch(fetchInterestsByUser(userId));
          dispatch(fetchPortfolioByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de l'intérêt:", err);
          alert("Erreur lors de la suppression de l'intérêt.");
        });
    }
  };

  const handleTogglePublic = (interestId: string) => {
    const interest = interests.find((i) => i.id === interestId);
    if (interest && userId) {
      dispatch(
        updateInterest({
          id: interestId,
          interestData: { name: interest.name, isPublic: !interest.isPublic }, // Utilisé isPublic
        })
      )
        .unwrap()
        .then(() => {
          dispatch(fetchInterestsByUser(userId));
          dispatch(fetchPortfolioByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de l'intérêt:", err);
          alert("Erreur lors de la mise à jour de l'intérêt.");
        });
    }
  };

  return (
    <div className="interest-container">
      <h2>Centres d’Intérêt</h2>

      {status === "loading" && <p className="loading-text">Chargement des centres d’intérêt...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {interests.length > 0 ? (
        <ul className="interest-list">
          {interests.map((interest) => (
            <li key={interest.id} className="interest-item">
              <div className="interest-info">
                <strong>{interest.name}</strong>
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={interest.isPublic || false} // Utilisé isPublic
                    onChange={() => handleTogglePublic(interest.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedInterest(interest)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteInterest(interest.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-interest-text">Aucun centre d’intérêt enregistré.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddInterest onClose={() => setShowAddForm(false)} onAdd={handleUpdateInterest} />}
      {selectedInterest && (
        <UpdateInterest
          interest={selectedInterest}
          onClose={() => setSelectedInterest(null)}
          onUpdate={handleUpdateInterest}
        />
      )}
    </div>
  );
};

export default Interest;