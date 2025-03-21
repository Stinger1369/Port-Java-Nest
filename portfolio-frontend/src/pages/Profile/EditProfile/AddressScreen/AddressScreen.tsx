import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import { updateUserAddress, updateGeolocation } from "../../../../redux/features/googleMapsSlice";
import { useGoogleMaps } from "../../../../hooks/useGoogleMaps";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // Importez les icônes
import "./AddressScreen.css";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  onBack?: () => void;
  onNext?: () => void;
}

const AddressScreen = ({ formData, setFormData, onBack, onNext }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const { latitude, longitude } = useSelector((state: RootState) => state.googleMaps);
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const [modalAddress, setModalAddress] = useState(formData.address || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (isGoogleMapsLoaded && autocompleteRef.current && isModalOpen) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
        types: ["address"],
        fields: ["formatted_address", "geometry", "address_components"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && user) {
          const newLatitude = place.geometry.location.lat();
          const newLongitude = place.geometry.location.lng();
          const newAddress = place.formatted_address || "";
          let city = "";
          let country = "";
          place.address_components?.forEach((component) => {
            if (component.types.includes("locality") || component.types.includes("sublocality")) {
              city = component.long_name;
            } else if (component.types.includes("country")) {
              country = component.long_name;
            }
          });
          setModalAddress(newAddress);
          setFormData({ ...formData, city, country });
          dispatch(updateGeolocation({ userId: user.id, latitude: newLatitude, longitude: newLongitude }));
        }
      });
    }
  }, [isGoogleMapsLoaded, isModalOpen, dispatch, user, formData, setFormData]);

  const handleManualUpdateGeolocation = async () => {
    if (!navigator.geolocation || !user?.id) {
      setGeoError(t("address.geoNotSupported", "Geolocation is not supported by this browser."));
      return;
    }

    const isSecureOrigin = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecureOrigin) {
      setGeoError(t("address.geoSecureError", "La géolocalisation nécessite une connexion sécurisée (HTTPS) ou localhost. Utilisez http://localhost:5173."));
      return;
    }

    setIsGeoLoading(true);
    setGeoError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            console.error("Erreur géolocalisation:", err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      });

      const { latitude: newLatitude, longitude: newLongitude } = position.coords;
      await dispatch(updateGeolocation({ userId: user.id, latitude: newLatitude, longitude: newLongitude })).unwrap();
      await handleUpdateAddress(newLatitude, newLongitude);
    } catch (err: any) {
      const errorMessage = err.code === err.PERMISSION_DENIED
        ? t("address.geoPermissionDenied", "La géolocalisation a été bloquée. Veuillez autoriser l'accès.")
        : err.code === err.POSITION_UNAVAILABLE
        ? t("address.geoUnavailable", "Les données de géolocalisation ne sont pas disponibles.")
        : t("address.geoError", { message: err.message || "Une erreur inconnue s'est produite." });
      setGeoError(errorMessage);
      console.error("Erreur de géolocalisation manuelle:", err.message);
    } finally {
      setIsGeoLoading(false);
    }
  };

  const handleUpdateAddress = async (lat?: number, lon?: number) => {
    if (!user) return;

    const latToUse = lat ?? latitude;
    const lonToUse = lon ?? longitude;

    if (latToUse == null || lonToUse == null) {
      console.error("❌ Latitude ou longitude manquante pour la mise à jour de l'adresse");
      return;
    }

    setIsAddressLoading(true);
    try {
      const updatedUser = await dispatch(updateUserAddress({ userId: user.id, latitude: latToUse, longitude: lonToUse })).unwrap();
      setFormData({
        ...formData,
        address: updatedUser.address || formData.address,
        city: updatedUser.city || formData.city,
        country: updatedUser.country || formData.country,
      });
      setModalAddress(updatedUser.address || "");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour de l’adresse :", error);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const saveModalAddress = () => {
    setFormData({ ...formData, address: modalAddress });
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalAddress(formData.address || "");
  };

  return (
    <div className="address-screen">
      <h3>{t("editProfile.addressInfo", "Address Information")}</h3>
      <label>{t("editProfile.address", "Address")} :</label>
      <input type="text" value={formData.address} disabled />

      <button onClick={handleManualUpdateGeolocation} disabled={isGeoLoading || isAddressLoading}>
        {isGeoLoading || isAddressLoading
          ? t("editProfile.updatingAddress", "Updating...")
          : t("editProfile.updateLocationAndAddress", "Update Location and Address")}
      </button>

      <button onClick={() => setIsModalOpen(true)} disabled={!isGoogleMapsLoaded}>
        {t("editProfile.changeAddress", "Change Address Manually")}
      </button>

      {geoError && <p className="error">{geoError}</p>}

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

      <div className="navigation-buttons">
        <button className="nav-button back-button" onClick={onBack} title={t("editProfile.previous", "Previous")}>
          <FaArrowLeft />
        </button>
        <button className="nav-button next-button" onClick={onNext} title={t("editProfile.next", "Next")}>
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default AddressScreen;