import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchInterestsByUser, deleteInterest } from "../../../redux/features/interestSlice";
import AddInterest from "./AddInterest";
import UpdateInterest from "./UpdateInterest";
import "./Interest.css";

const Interest = () => {
  const dispatch = useDispatch<AppDispatch>();
  const interests = useSelector((state: RootState) => state.interest.interests) || [];
  const status = useSelector((state: RootState) => state.interest.status);
  const error = useSelector((state: RootState) => state.interest.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchInterestsByUser(userId));
    }
  }, [dispatch, userId]);

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
                <button className="edit-button" onClick={() => setSelectedInterest(interest)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteInterest(interest.id))}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-interest-text">Aucun centre d’intérêt enregistré.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddInterest onClose={() => setShowAddForm(false)} />}
      {selectedInterest && <UpdateInterest interest={selectedInterest} onClose={() => setSelectedInterest(null)} />}
    </div>
  );
};

export default Interest;
