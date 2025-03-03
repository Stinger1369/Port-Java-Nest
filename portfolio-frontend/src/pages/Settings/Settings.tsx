// Settings.tsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../redux/store";
import { deleteUser, clearUserState } from "../../redux/features/userSlice";
import { logout } from "../../redux/features/authSlice"; // Ajout de logout
import { useTranslation } from "react-i18next";
import "./Settings.css";

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((state: RootState) => state.user);
  const { t } = useTranslation();

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      console.error("❌ Aucun utilisateur connecté pour supprimer le compte");
      return;
    }

    if (window.confirm(t("settings.confirmDelete"))) {
      try {
        await dispatch(deleteUser(user.id)).unwrap();
        console.log("✅ Compte supprimé avec succès");

        // Réinitialiser les états Redux
        dispatch(clearUserState()); // Réinitialise userSlice
        await dispatch(logout()).unwrap(); // Réinitialise authSlice et supprime localStorage

        // Redirection immédiate
        navigate("/login", { replace: true }); // replace: true pour éviter le retour en arrière
      } catch (err) {
        console.error("❌ Échec de la suppression du compte:", err);
      }
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