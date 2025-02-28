import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import { updateUser } from "../../../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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

  const handleSubmit = async () => {
    if (!hasChanges()) {
      alert(t("editProfile.noChanges", "Aucun changement"));
      return;
    }
    if (!formData.id) {
      console.error("Erreur : ID de l'utilisateur manquant dans formData");
      alert(t("editProfile.error", "Une erreur est survenue. L'ID de l'utilisateur est manquant."));
      return;
    }
    console.log("🔹 Données envoyées pour mise à jour :", { ...formData, age: undefined });
    console.log("🔹 Valeur de showBirthdate avant envoi :", formData.showBirthdate); // Log supplémentaire

    try {
      await dispatch(updateUser({ id: formData.id, ...formData })).unwrap();
      console.log("✅ Mise à jour réussie, redirection vers le profil");
      navigate("/profile");
    } catch (error) {
      console.error("❌ Échec de la mise à jour :", error);
      alert(t("editProfile.updateFailed", "Échec de la mise à jour : ") + error);
    }
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
          <button onClick={handleSubmit} disabled={!hasChanges() || status === "loading"}>
            {t("editProfile.save", "Save Changes")}
          </button>
        </>
      )}
    </div>
  );
};

export default ConfirmationScreen;