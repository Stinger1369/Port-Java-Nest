import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchLanguagesByUser, deleteLanguage, updateLanguage } from "../../../redux/features/languageSlice";
import AddLanguage from "./AddLanguage";
import UpdateLanguage from "./UpdateLanguage";
import "./Languages.css";

const Languages = () => {
  const dispatch = useDispatch<AppDispatch>();
  const languages = useSelector((state: RootState) => state.language.languages) || [];
  const status = useSelector((state: RootState) => state.language.status);
  const error = useSelector((state: RootState) => state.language.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [languageIdToDelete, setLanguageIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      dispatch(fetchLanguagesByUser(userId));
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

  const handleTogglePublic = (languageId: string) => {
    const language = languages.find((lang) => lang.id === languageId);
    if (language && userId) {
      dispatch(
        updateLanguage({
          id: languageId,
          languageData: { name: language.name, proficiencyLevel: language.proficiencyLevel, isPublic: !language.isPublic },
        })
      )
        .unwrap()
        .then(() => {
          setSuccessMessage("Visibilité de la langue mise à jour avec succès !");
          dispatch(fetchLanguagesByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la langue:", err);
          setErrorMessage("Erreur lors de la mise à jour de la langue.");
        });
    }
  };

  const handleDeleteLanguage = (languageId: string) => {
    setLanguageIdToDelete(languageId);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (languageIdToDelete && userId) {
      dispatch(deleteLanguage(languageIdToDelete))
        .unwrap()
        .then(() => {
          setSuccessMessage("Langue supprimée avec succès !");
          dispatch(fetchLanguagesByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de la langue:", err);
          setErrorMessage("Erreur lors de la suppression de la langue.");
        });
    }
    setShowConfirmModal(false);
    setLanguageIdToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setLanguageIdToDelete(null);
  };

  return (
    <div className="languages-container">
      <h2>Langues Parlées</h2>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {status === "loading" && <p className="loading-text">Chargement des langues...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {languages.length > 0 ? (
        <ul className="languages-list">
          {languages.map((lang) => (
            <li key={lang.id} className="language-item">
              <div className="language-info">
                <strong>{lang.name}</strong> - {lang.proficiencyLevel}
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={lang.isPublic || false}
                    onChange={() => handleTogglePublic(lang.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedLanguage(lang)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteLanguage(lang.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-languages-text">Aucune langue enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddLanguage onClose={() => setShowAddForm(false)} />}
      {selectedLanguage && <UpdateLanguage language={selectedLanguage} onClose={() => setSelectedLanguage(null)} />}

      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer cette langue ?</p>
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

export default Languages;