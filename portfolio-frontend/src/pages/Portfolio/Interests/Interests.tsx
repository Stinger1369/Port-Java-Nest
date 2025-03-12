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
    isPublic?: boolean;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [interestIdToDelete, setInterestIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchInterestsByUser(userId));
      dispatch(fetchPortfolioByUser(userId));
    }
  }, [dispatch, userId]);

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

  const handleUpdateInterest = (updatedInterest: { id: string; name: string }) => {
    setSelectedInterest(null);
  };

  const handleDeleteInterest = (interestId: string) => {
    setInterestIdToDelete(interestId);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (interestIdToDelete && userId) {
      dispatch(deleteInterest(interestIdToDelete))
        .unwrap()
        .then(() => {
          setSuccessMessage("Centre d’intérêt supprimé avec succès !");
          dispatch(fetchInterestsByUser(userId));
          dispatch(fetchPortfolioByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de l'intérêt:", err);
          setErrorMessage("Erreur lors de la suppression de l’intérêt.");
        });
    }
    setShowConfirmModal(false);
    setInterestIdToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setInterestIdToDelete(null);
  };

  const handleTogglePublic = (interestId: string) => {
    const interest = interests.find((i) => i.id === interestId);
    if (interest && userId) {
      dispatch(
        updateInterest({
          id: interestId,
          interestData: { name: interest.name, isPublic: !interest.isPublic },
        })
      )
        .unwrap()
        .then(() => {
          setSuccessMessage("Visibilité du centre d’intérêt mise à jour avec succès !");
          dispatch(fetchInterestsByUser(userId));
          dispatch(fetchPortfolioByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de l'intérêt:", err);
          setErrorMessage("Erreur lors de la mise à jour de l’intérêt.");
        });
    }
  };

  return (
    <div className="interest-container">
      <h2>Centres d’Intérêt</h2>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
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
                    checked={interest.isPublic || false}
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
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer ce centre d’intérêt ?</p>
            <div className="confirm-modal-actions">
              <button className="confirm-button" onClick={confirmDelete}>Oui</button>
              <button className="cancel-button" onClick={cancelDelete}>Non</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interest;