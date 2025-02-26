import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser, updateUser } from "../../../redux/features/userSlice";
import { updateUserAddress, updateGeolocation } from "../../../redux/features/googleMapsSlice";
import { useTranslation } from "react-i18next";
import PhoneInputComponent from "../../../components/PhoneInput/PhoneInputComponent";
import { useGoogleMaps } from "../../../hooks/useGoogleMaps";
import "./EditProfile.css";

const EditProfile = () => {
  const { t, ready } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const { address, latitude, longitude, status: googleMapsStatus, error: googleMapsError } = useSelector((state: RootState) => state.googleMaps);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);
  const message = useSelector((state: RootState) => state.user.message);

  const { isLoaded: isGoogleMapsLoaded, error: loadError } = useGoogleMaps();

  const userId = localStorage.getItem("userId");
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState("");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [initialFormData, setInitialFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    sex: "",
    bio: "",
    latitude: 0,
    longitude: 0,
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    sex: "",
    bio: "",
  });

  // Initialisation des données du formulaire et des données initiales
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!user && userId) {
      dispatch(fetchUser());
    } else if (user) {
      const normalizedPhone = user.phone && !user.phone.startsWith("+") ? `+${user.phone}` : user.phone || "";
      const initialData = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: normalizedPhone,
        address: address || user.address || "",
        sex: user.sex || "",
        bio: user.bio || "",
        latitude: latitude || user.latitude || 0,
        longitude: longitude || user.longitude || 0,
      };
      setInitialFormData(initialData);
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        phone: initialData.phone,
        address: initialData.address,
        sex: initialData.sex,
        bio: initialData.bio,
      });
      setModalAddress(initialData.address);
    }
  }, [token, user, userId, dispatch, navigate, address, latitude, longitude]);

  // Gestion de l’autocomplétion Google Maps dans le modal
  useEffect(() => {
    if (isGoogleMapsLoaded && autocompleteRef.current && isModalOpen) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
        types: ["address"],
        fields: ["formatted_address", "geometry"],
      });

      // Ajoute la fonction handlePlaceChange comme listener
      const handlePlaceChange = () => {
        const place = autocomplete.getPlace();
        if (place.geometry && user) {
          const newLatitude = place.geometry.location.lat();
          const newLongitude = place.geometry.location.lng();
          const newAddress = place.formatted_address || "";

          console.log("🔹 Nouvelles coordonnées avant updateGeolocation :", { latitude: newLatitude, longitude: newLongitude }); // Ajouté pour déboguer
          setModalAddress(newAddress);
          dispatch(updateGeolocation({ userId: user.id, latitude: newLatitude, longitude: newLongitude }));
        }
      };

      autocomplete.addListener("place_changed", handlePlaceChange);
    }
  }, [isGoogleMapsLoaded, isModalOpen, dispatch, user]);

  // Gestion des changements dans les champs
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handlePhoneChange = useCallback((phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));
  }, []);

  // Vérifier si des modifications ont été apportées
  const hasChanges = useCallback(() => {
    return (
      formData.firstName !== initialFormData.firstName ||
      formData.lastName !== initialFormData.lastName ||
      formData.phone !== initialFormData.phone ||
      formData.address !== initialFormData.address ||
      formData.sex !== initialFormData.sex ||
      formData.bio !== initialFormData.bio ||
      latitude !== initialFormData.latitude ||
      longitude !== initialFormData.longitude
    );
  }, [formData, initialFormData, latitude, longitude]);

  // Sauvegarde du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && hasChanges()) {
      const payload = {
        id: user.id,
        ...formData,
        latitude, // Récupéré de googleMapsSlice
        longitude, // Récupéré de googleMapsSlice
      };
      dispatch(updateUser(payload));
    }
  };

  // Mise à jour automatique de l’adresse via le backend
  const handleUpdateAddress = useCallback(async () => {
    if (user && (latitude || longitude)) {
      setIsAddressLoading(true);
      await dispatch(updateUserAddress(user.id))
        .unwrap()
        .then((updatedUser) => {
          setFormData((prev) => ({
            ...prev,
            address: updatedUser.address || prev.address,
          }));
          setModalAddress(updatedUser.address || "");
        });
      setIsAddressLoading(false);
    }
  }, [dispatch, user, latitude, longitude]);

  // Gestion du modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setModalAddress(address || formData.address);
  };
  const saveModalAddress = () => {
    setFormData((prev) => ({ ...prev, address: modalAddress }));
    setIsModalOpen(false);
  };

  if (!ready) {
    return <div>{t("loading", "Loading translations...")}</div>;
  }

  return (
    <div className="edit-profile-container">
      <h2>{t("editProfile.title", "Edit Profile")}</h2>

      {status === "loading" && !isAddressLoading && <p>{t("editProfile.loading", "Loading...")}</p>}
      {error && <p className="error">{t("editProfile.error", { message: error })}</p>}
      {googleMapsError && <p className="error">{t("editProfile.googleMapsError", { message: googleMapsError })}</p>}
      {loadError && <p className="error">{t("editProfile.googleMapsLoadError", { message: loadError })}</p>}
      {message && <p className="success">{t("editProfile.success", "Profile updated successfully")}</p>}
      {!isGoogleMapsLoaded && <p>{t("editProfile.loadingGoogleMaps", "Loading Google Maps...")}</p>}

      <form onSubmit={handleSubmit}>
        <label>{t("editProfile.firstName", "First Name")} :</label>
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />

        <label>{t("editProfile.lastName", "Last Name")} :</label>
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />

        <PhoneInputComponent
          value={formData.phone}
          onChange={handlePhoneChange}
          label={t("editProfile.phone", "Phone")}
        />

        <label>{t("editProfile.address", "Address")} :</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder={t("editProfile.addressPlaceholder", "Your current address")}
          disabled
        />
        <button
          type="button"
          onClick={handleUpdateAddress}
          disabled={isAddressLoading || (!latitude && !longitude)}
        >
          {isAddressLoading
            ? t("editProfile.updatingAddress", "Updating...")
            : t("editProfile.updateAddress", "Update Address Automatically")}
        </button>
        <button type="button" onClick={openModal} disabled={!isGoogleMapsLoaded}>
          {t("editProfile.changeAddress", "Change Address")}
        </button>

        <label>{t("editProfile.sex", "Sex")} :</label>
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="">{t("editProfile.sexOptions.unspecified", "Not specified")}</option>
          <option value="Man">{t("editProfile.sexOptions.man", "Man")}</option>
          <option value="Woman">{t("editProfile.sexOptions.woman", "Woman")}</option>
          <option value="Other">{t("editProfile.sexOptions.other", "Other")}</option>
        </select>

        <label>{t("editProfile.bio", "Bio")} :</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} />

        <button type="submit" disabled={status === "loading" || !hasChanges()}>
          {t("editProfile.submit", "Save")}
        </button>
      </form>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t("editProfile.modalTitle", "Change Your Address")}</h3>
            <input
              type="text"
              value={modalAddress}
              onChange={(e) => setModalAddress(e.target.value)}
              ref={autocompleteRef}
              placeholder={t("editProfile.addressPlaceholder", "Enter your address")}
              disabled={!isGoogleMapsLoaded}
            />
            <div className="modal-actions">
              <button onClick={saveModalAddress} disabled={!modalAddress}>
                {t("editProfile.modalSave", "Save")}
              </button>
              <button onClick={closeModal}>{t("editProfile.modalCancel", "Cancel")}</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/profile")} disabled={status === "loading"}>
        {t("editProfile.backToProfile", "Back to profile")}
      </button>
    </div>
  );
};

const EditProfileWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <EditProfile />
  </Suspense>
);

export default EditProfileWithSuspense;