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
import "./EditProfileContainer.css";

const EditProfileContainer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const { address, latitude, longitude, city, country } = useSelector((state: RootState) => state.googleMaps);

  const [currentScreen, setCurrentScreen] = useState(1); // 1: Personal, 2: Address, 3: Images, 4: Confirmation
  const totalScreens = 4;

  // Données initiales de l'utilisateur
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
  });

  // Données du formulaire centralisées (à passer aux sous-composants)
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
  });

  // Charger les données utilisateur au montage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(fetchUser());
    }
  }, [dispatch]);

  // Synchroniser formData avec les données de l'utilisateur
  useEffect(() => {
    if (user) {
      const normalizedPhone = user.phone && !user.phone.startsWith("+") ? `+${user.phone}` : user.phone || "";
      const updatedFormData = {
        id: user.id || "", // Ajout de l'ID de l'utilisateur
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: normalizedPhone,
        sex: user.sex || "",
        bio: user.bio || "",
        address: address || user.address || "",
        city: city || user.city || "",
        country: country || user.country || "",
        latitude: latitude || user.latitude || 0,
        longitude: longitude || user.longitude || 0,
      };
      setInitialFormData(updatedFormData); // Stocker les données initiales
      setFormData(updatedFormData); // Initialiser formData avec les données utilisateur
    }
  }, [user, address, latitude, longitude, city, country]);

  // Vérifier s'il y a des changements
  const hasChanges = () => {
    return (
      formData.id === initialFormData.id && ( // Vérifier que l'ID est le même
        formData.firstName !== initialFormData.firstName ||
        formData.lastName !== initialFormData.lastName ||
        formData.phone !== initialFormData.phone ||
        formData.address !== initialFormData.address ||
        formData.city !== initialFormData.city ||
        formData.country !== initialFormData.country ||
        formData.sex !== initialFormData.sex ||
        formData.bio !== initialFormData.bio ||
        formData.latitude !== initialFormData.latitude ||
        formData.longitude !== initialFormData.longitude
      )
    );
  };

  const handleNext = () => {
    if (currentScreen < totalScreens) setCurrentScreen(currentScreen + 1);
  };

  const handleBack = () => {
    if (currentScreen > 1) setCurrentScreen(currentScreen - 1);
    else navigate("/profile");
  };

  const handleClose = () => {
    navigate("/profile"); // Retour direct au profil
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return <PersonalInfoScreen formData={formData} setFormData={setFormData} />;
      case 2:
        return <AddressScreen formData={formData} setFormData={setFormData} />;
      case 3:
        return <ImagesScreen />;
      case 4:
        return (
          <ConfirmationScreen
            formData={formData}
            hasChanges={hasChanges} // Passer la fonction directement
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
      {renderScreen()}
      <div className="navigation-buttons">
        <button onClick={handleBack}>
          {currentScreen === 1 ? t("editProfile.backToProfile", "Back to Profile") : t("editProfile.previous", "Previous")}
        </button>
        {currentScreen < totalScreens && (
          <button onClick={handleNext}>{t("editProfile.next", "Next")}</button>
        )}
      </div>
    </div>
  );
};

export default EditProfileContainer;