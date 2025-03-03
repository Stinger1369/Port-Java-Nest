import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import { updateUser } from "../../../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./ConfirmationScreen.css";

interface Props {
  formData: any;
  hasChanges: () => boolean;
}

const ConfirmationScreen = ({ formData, hasChanges }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const status = useSelector((state: RootState) => state.user.status);

  // Sauvegarde automatique au montage de l'écran
  useEffect(() => {
    const autoSave = async () => {
      // Vérifier si les champs obligatoires sont remplis
      if (!formData.firstName || !formData.lastName) {
        console.log("⚠️ Champs obligatoires manquants, pas de sauvegarde automatique");
        return;
      }

      if (!formData.id) {
        console.error("Erreur : ID de l'utilisateur manquant dans formData");
        return;
      }

      console.log("🔹 Sauvegarde automatique des données :", { ...formData, age: undefined });
      console.log("🔹 Valeur de showBirthdate avant envoi :", formData.showBirthdate);

      try {
        await dispatch(updateUser({ id: formData.id, ...formData })).unwrap();
        console.log("✅ Sauvegarde automatique réussie");
      } catch (error) {
        console.error("❌ Échec de la sauvegarde automatique :", error);
      }
    };

    autoSave();
  }, [dispatch, formData]);

  const handleSubmit = async () => {
    // Vérifier si des champs obligatoires sont manquants
    if (!formData.firstName || !formData.lastName) {
      alert(t("editProfile.missingRequiredFields", "First Name and Last Name are required."));
      return;
    }

    // Les données ont déjà été sauvegardées automatiquement, donc on redirige simplement
    navigate("/profile");
  };

  return (
    <div className="confirmation-screen">
      <h3>{t("editProfile.confirmation", "Confirm Changes")}</h3>
      {status === "loading" ? (
        <p>{t("editProfile.saving", "Saving...")}</p>
      ) : (
        <>
          <ul>
            <li>
              <i className="fas fa-user label-icon"></i>
              <span className="label">{t("editProfile.firstName", "First Name")}</span>
              <span className="value">{formData.firstName || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-user label-icon"></i>
              <span className="label">{t("editProfile.lastName", "Last Name")}</span>
              <span className="value">{formData.lastName || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-phone label-icon"></i>
              <span className="label">{t("editProfile.phone", "Phone")}</span>
              <span className="value">{formData.phone || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-home label-icon"></i>
              <span className="label">{t("editProfile.address", "Address")}</span>
              <span className="value">{formData.address || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-city label-icon"></i>
              <span className="label">{t("editProfile.city", "City")}</span>
              <span className="value">{formData.city || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-flag label-icon"></i>
              <span className="label">{t("editProfile.country", "Country")}</span>
              <span className="value">{formData.country || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-venus-mars label-icon"></i>
              <span className="label">{t("editProfile.sex", "Sex")}</span>
              <span className="value">{formData.sex || "Not specified"}</span>
            </li>
            <li>
              <i className="fas fa-calendar label-icon"></i>
              <span className="label">{t("editProfile.birthdate", "Birthdate")}</span>
              <span className="value">{formData.birthdate || "Not provided"}</span>
            </li>
            <li>
              <i className="fas fa-eye label-icon"></i>
              <span className="label">{t("editProfile.showBirthdate", "Show Birthdate")}</span>
              <span className="value">{formData.showBirthdate ? "Yes" : "No"}</span>
            </li>
            <li>
              <i className="fas fa-calendar-check label-icon"></i>
              <span className="label">{t("editProfile.age", "Age")}</span>
              <span className="value">{formData.age || "Not calculated"}</span>
            </li>
            <li>
              <i className="fas fa-book label-icon"></i>
              <span className="label">{t("editProfile.bio", "Bio")}</span>
              <span className="value">{formData.bio || "No biography"}</span>
            </li>
          </ul>
          <button onClick={handleSubmit} disabled={status === "loading" || (!formData.firstName || !formData.lastName)}>
            {t("editProfile.continueToProfile", "Continue to Profile")}
          </button>
        </>
      )}
    </div>
  );
};

export default ConfirmationScreen;