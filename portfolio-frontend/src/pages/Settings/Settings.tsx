import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../redux/store";
import { deleteUser, clearUserState } from "../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import "./Settings.css";

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((state: RootState) => state.user);
  const { t } = useTranslation();

  const handleDeleteAccount = () => {
    if (!user?.id) {
      console.error("❌ Aucun utilisateur connecté pour supprimer le compte");
      return;
    }

    if (window.confirm(t("settings.confirmDelete"))) {
      dispatch(deleteUser(user.id))
        .unwrap()
        .then(() => {
          console.log("✅ Compte supprimé avec succès");
          dispatch(clearUserState()); // Réinitialise l'état utilisateur
          localStorage.removeItem("token"); // Supprime le token
          localStorage.removeItem("userId"); // Supprime l'ID utilisateur
          navigate("/login"); // Redirige vers la page de connexion
        })
        .catch((err) => {
          console.error("❌ Échec de la suppression du compte:", err);
        });
    }
  };

  return (
    <div className="settings-page">
      <h1>{t("settings.title")}</h1>
      {status === "loading" && <p>{t("settings.loading")}</p>}
      {error && <p className="error">{t("settings.error")}: {error}</p>}
      <div className="settings-content">
        <h2>{t("settings.accountManagement")}</h2>
        <button
          className="delete-account-btn"
          onClick={handleDeleteAccount}
          disabled={status === "loading"}
        >
          {t("settings.deleteAccount")}
        </button>
      </div>
    </div>
  );
};

export default Settings;