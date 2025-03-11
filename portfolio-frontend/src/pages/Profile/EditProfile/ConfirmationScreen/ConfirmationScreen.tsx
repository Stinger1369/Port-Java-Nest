import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import { updateUser } from "../../../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaUser } from "react-icons/fa"; // Ajout de FaUser pour le bouton "Return"
import "./ConfirmationScreen.css";

interface Props {
  formData: any;
  hasChanges: () => boolean;
  onBack?: () => void;
  onNext?: () => void;
}

const ConfirmationScreen = ({ formData, hasChanges, onBack, onNext }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const status = useSelector((state: RootState) => state.user.status);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) onBack(); // Retourne à l'écran précédent (géré par le parent)
  };

  const handleReturnToProfile = () => {
    if (hasChanges()) {
      setIsModalOpen(true); // Ouvre la modale si des changements sont détectés
    } else {
      navigate("/profile"); // Retourne au profil directement si aucun changement
    }
  };

  const handleFinish = async () => {
    if (!formData.firstName || !formData.lastName) {
      setMessage(t("editProfile.missingRequiredFields", "First Name and Last Name are required."));
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!formData.id) {
      setMessage(t("editProfile.error", "An error occurred. User ID is missing."));
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!hasChanges()) {
      setMessage(t("editProfile.noChanges", "No changes detected to save."));
      setTimeout(() => {
        setMessage(null);
        navigateNext();
      }, 2000);
      return;
    }

    try {
      console.log("🔹 Sauvegarde des données :", { ...formData, age: undefined });
      await dispatch(updateUser({ id: formData.id, ...formData })).unwrap();
      setMessage(t("editProfile.saveSuccess", "Changes saved successfully!"));
      setTimeout(() => {
        setMessage(null);
        navigateNext();
      }, 2000);
    } catch (error) {
      console.error("❌ Échec de la sauvegarde :", error);
      setMessage(t("editProfile.saveError", "Failed to save changes. Please try again."));
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const navigateNext = () => {
    if (onNext) onNext();
    else navigate("/profile");
  };

  const confirmDiscard = () => {
    setIsModalOpen(false);
    navigate("/profile"); // Retourne au profil sans sauvegarder
  };

  const cancelDiscard = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="confirmation-screen">
      <h3>{t("editProfile.confirmation", "Confirm Changes")}</h3>
      {status === "loading" ? (
        <p className="status-message">{t("editProfile.saving", "Saving...")}</p>
      ) : (
        <>
          <ul className="confirmation-list">
            {[
              { icon: "fas fa-user", label: t("editProfile.firstName", "First Name"), value: formData.firstName },
              { icon: "fas fa-user", label: t("editProfile.lastName", "Last Name"), value: formData.lastName },
              { icon: "fas fa-phone", label: t("editProfile.phone", "Phone"), value: formData.phone },
              { icon: "fas fa-home", label: t("editProfile.address", "Address"), value: formData.address },
              { icon: "fas fa-city", label: t("editProfile.city", "City"), value: formData.city },
              { icon: "fas fa-flag", label: t("editProfile.country", "Country"), value: formData.country },
              { icon: "fas fa-venus-mars", label: t("editProfile.sex", "Sex"), value: formData.sex || "Not specified" },
              { icon: "fas fa-calendar", label: t("editProfile.birthdate", "Birthdate"), value: formData.birthdate },
              { icon: "fas fa-eye", label: t("editProfile.showBirthdate", "Show Birthdate"), value: formData.showBirthdate ? "Yes" : "No" },
              { icon: "fas fa-calendar-check", label: t("editProfile.age", "Age"), value: formData.age || "Not calculated" },
              { icon: "fas fa-book", label: t("editProfile.bio", "Bio"), value: formData.bio || "No biography" },
            ].map((item, index) => (
              <li key={index}>
                <i className={`${item.icon} label-icon`}></i>
                <span className="label">{item.label}</span>
                <span className="value">{item.value || "Not provided"}</span>
              </li>
            ))}
          </ul>
          {message && (
            <p className={message.includes("Error") || message.includes("échec") ? "error-message" : "success-message"}>
              {message}
            </p>
          )}
          <div className="navigation-buttons">
            <button
              className="nav-button back-button"
              onClick={handleBack}
              title={t("editProfile.previous", "Previous")}
            >
              <FaArrowLeft />
            </button>
            <button
              className="nav-button return-button"
              onClick={handleReturnToProfile}
              title={t("editProfile.returnToProfile", "Return to Profile")}
            >
              <FaUser />
            </button>
            <button
              className="nav-button finish-button"
              onClick={handleFinish}
              disabled={status === "loading" || (!formData.firstName || !formData.lastName)}
              title={t("editProfile.finish", "Finish")}
            >
              <FaArrowRight />
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>{t("editProfile.confirmDiscardTitle", "Discard Changes?")}</h4>
            <p>{t("editProfile.confirmDiscardMessage", "You have unsaved changes. Are you sure you want to leave without saving?")}</p>
            <div className="modal-actions">
              <button className="modal-button confirm-button" onClick={confirmDiscard}>
                {t("editProfile.yesDiscard", "Yes, discard")}
              </button>
              <button className="modal-button cancel-button" onClick={cancelDiscard}>
                {t("editProfile.noStay", "No, stay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmationScreen;