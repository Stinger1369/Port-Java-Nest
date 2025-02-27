import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux/store";
import { updateUser } from "../../../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import "./ConfirmationScreen.css";

interface Props {
  formData: any;
  hasChanges: () => boolean;
}

const ConfirmationScreen = ({ formData, hasChanges }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = () => {
    if (!hasChanges()) {
      alert(t("editProfile.noChanges", "Aucun changement")); // Message personnalisé
      return;
    }
    // Vérifier que formData.id existe avant de l'utiliser
    if (!formData.id) {
      console.error("Erreur : ID de l'utilisateur manquant dans formData");
      alert(t("editProfile.error", "Une erreur est survenue. L'ID de l'utilisateur est manquant."));
      return;
    }
    dispatch(updateUser({ id: formData.id, ...formData }));
  };

  return (
    <div className="confirmation-screen">
      <h3>{t("editProfile.confirmation", "Confirm Changes")}</h3>
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
          <i className="fas fa-book label-icon"></i>
          <span className="label">{t("editProfile.bio", "Bio")}</span>
          <span className="value">{formData.bio || "No biography"}</span>
        </li>
      </ul>
      <button onClick={handleSubmit} disabled={!hasChanges()}>
        {t("editProfile.save", "Save Changes")}
      </button>
    </div>
  );
};

export default ConfirmationScreen;