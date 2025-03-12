import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchUser } from "../../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import PersonalInfoScreen from "./PersonalInfoScreen/PersonalInfoScreen";
import AddressScreen from "./AddressScreen/AddressScreen";
import ImagesScreen from "./ImagesScreen/ImagesScreen";
import ConfirmationScreen from "./ConfirmationScreen/ConfirmationScreen";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "./EditProfileContainer.css";

const EditProfileContainer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const { address, latitude, longitude, city, country } = useSelector((state: RootState) => state.googleMaps);

  const [currentScreen, setCurrentScreen] = useState(1);
  const totalScreens = 4;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [initialFormData, setInitialFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
    sex: "",
    bio: "",
    address: "",
    city: "",
    country: "",
    latitude: 0,
    longitude: 0,
    birthdate: "",
    showBirthdate: false,
    age: 0,
  });

  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
    sex: "",
    bio: "",
    address: "",
    city: "",
    country: "",
    latitude: 0,
    longitude: 0,
    birthdate: "",
    showBirthdate: false,
    age: 0,
  });

  const [isInitialDataSet, setIsInitialDataSet] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(fetchUser());
    } else {
      console.error("❌ Aucun userId trouvé dans localStorage, redirection vers /login");
      setErrorMessage("Aucun utilisateur connecté. Redirection vers la page de connexion.");
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (user && !isInitialDataSet) {
      const normalizedPhone = user.phone && !user.phone.startsWith("+") ? `+${user.phone}` : user.phone || "";
      const normalizedBirthdate = typeof user.birthdate === "string" && user.birthdate.includes("T")
        ? user.birthdate.split("T")[0]
        : user.birthdate || "";
      const updatedFormData = {
        id: user.id || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: normalizedPhone,
        sex: user.sex || "",
        bio: user.bio || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
        birthdate: normalizedBirthdate,
        showBirthdate: user.showBirthdate ?? false,
        age: user.age || 0,
      };
      setInitialFormData(updatedFormData);
      setFormData(updatedFormData);
      setIsInitialDataSet(true);
    }
  }, [user, isInitialDataSet]);

  useEffect(() => {
    if (isInitialDataSet) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        address: address || prevFormData.address,
        city: city || prevFormData.city,
        country: country || prevFormData.country,
        latitude: latitude || prevFormData.latitude,
        longitude: longitude || prevFormData.longitude,
      }));
    }
  }, [address, latitude, longitude, city, country, isInitialDataSet]);

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

  const hasChanges = () => {
    return (
      formData.id === initialFormData.id && (
        formData.firstName !== initialFormData.firstName ||
        formData.lastName !== initialFormData.lastName ||
        formData.phone !== initialFormData.phone ||
        formData.address !== initialFormData.address ||
        formData.city !== initialFormData.city ||
        formData.country !== initialFormData.country ||
        formData.sex !== initialFormData.sex ||
        formData.bio !== initialFormData.bio ||
        formData.latitude !== initialFormData.latitude ||
        formData.longitude !== initialFormData.longitude ||
        formData.birthdate !== initialFormData.birthdate ||
        formData.showBirthdate !== initialFormData.showBirthdate
      )
    );
  };

  const handleNext = () => {
    if (currentScreen < totalScreens) {
      setCurrentScreen(currentScreen + 1);
    } else {
      navigate("/profile");
    }
  };

  const handleBack = () => {
    if (hasChanges()) {
      setPendingNavigation(() => () => {
        if (currentScreen > 1) setCurrentScreen(currentScreen - 1);
        else navigate("/profile");
      });
      setShowConfirmModal(true);
    } else {
      if (currentScreen > 1) setCurrentScreen(currentScreen - 1);
      else navigate("/profile");
    }
  };

  const handleClose = () => {
    if (hasChanges()) {
      setPendingNavigation(() => () => navigate("/profile"));
      setShowConfirmModal(true);
    } else {
      navigate("/profile");
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return (
          <PersonalInfoScreen
            formData={formData}
            setFormData={setFormData}
            onBack={handleBack}
            onNext={handleNext}
            setSuccessMessage={setSuccessMessage}
            setErrorMessage={setErrorMessage}
          />
        );
      case 2:
        return (
          <AddressScreen
            formData={formData}
            setFormData={setFormData}
            onBack={handleBack}
            onNext={handleNext}
            setSuccessMessage={setSuccessMessage}
            setErrorMessage={setErrorMessage}
          />
        );
      case 3:
        return (
          <ImagesScreen
            onBack={handleBack}
            onNext={handleNext}
            setSuccessMessage={setSuccessMessage}
            setErrorMessage={setErrorMessage}
          />
        );
      case 4:
        return (
          <ConfirmationScreen
            formData={formData}
            hasChanges={hasChanges}
            onBack={handleBack}
            onNext={handleNext}
            setSuccessMessage={setSuccessMessage}
            setErrorMessage={setErrorMessage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="edit-profile-container" style={{ "--current-screen": currentScreen } as React.CSSProperties}>
      <div className="header-container">
        <h2>{t("editProfile.title", "Edit Profile")}</h2>
        <i className="fas fa-times close-icon" onClick={handleClose}></i>
      </div>
      <div className="progress-steps">
        {Array.from({ length: totalScreens }, (_, index) => (
          <div
            key={index + 1}
            className={`step ${currentScreen === index + 1 ? "active" : ""}`}
          >
            {index + 1}
          </div>
        ))}
        <div className="progress-line" style={{ "--current-screen": currentScreen } as React.CSSProperties}></div>
      </div>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {renderScreen()}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3>{t("editProfile.confirmExitTitle", "Confirmer la sortie")}</h3>
            <p>{t("editProfile.confirmExitMessage", "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?")}</p>
            <div className="confirm-modal-actions">
              <button className="confirm-button" onClick={confirmNavigation}>{t("editProfile.yes", "Oui")}</button>
              <button className="cancel-button" onClick={cancelNavigation}>{t("editProfile.no", "Non")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileContainer;