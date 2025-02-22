import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchLanguagesByUser, deleteLanguage } from "../../../redux/features/languageSlice";
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

  useEffect(() => {
    if (userId) {
      dispatch(fetchLanguagesByUser(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="languages-container">
      <h2>Langues Parlées</h2>

      {status === "loading" && <p className="loading-text">Chargement des langues...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {languages.length > 0 ? (
        <ul className="languages-list">
          {languages.map((lang) => (
            <li key={lang.id} className="language-item">
              <div className="language-info">
                <strong>{lang.name}</strong> - {lang.proficiencyLevel}
                <button className="edit-button" onClick={() => setSelectedLanguage(lang)}>✏️</button>
                <button className="delete-button" onClick={() => dispatch(deleteLanguage(lang.id))}>🗑️</button>
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
    </div>
  );
};

export default Languages;
