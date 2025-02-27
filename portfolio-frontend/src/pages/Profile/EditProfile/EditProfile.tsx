// portfolio-frontend/src/pages/Profile/EditProfile/EditProfile.tsx
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser, updateUser } from "../../../redux/features/userSlice";
import { updateUserAddress, updateGeolocation } from "../../../redux/features/googleMapsSlice";
import { uploadImage, getAllImagesByUserId, deleteImage } from "../../../redux/features/imageSlice";
import { useTranslation } from "react-i18next";
import PhoneInputComponent from "../../../components/PhoneInput/PhoneInputComponent";
import { useGoogleMaps } from "../../../hooks/useGoogleMaps";
import "./EditProfile.css";

interface Image {
  id: string | null;
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean;
  uploadedAt: string | null;
}

const EditProfile = () => {
  const { t, ready } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.user);
  const { address, latitude, longitude, city, country, status: googleMapsStatus, error: googleMapsError } = useSelector((state: RootState) => state.googleMaps);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);
  const message = useSelector((state: RootState) => state.user.message);
  const images = useSelector((state: RootState) => state.image.images);
  const imageStatus = useSelector((state: RootState) => state.image.status);
  const imageError = useSelector((state: RootState) => state.image.error);
  const imageMessage = useSelector((state: RootState) => state.image.message);

  const { isLoaded: isGoogleMapsLoaded, error: loadError } = useGoogleMaps();

  const userId = localStorage.getItem("userId");
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState("");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<Image | null>(null);

  const [initialFormData, setInitialFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
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
    city: "",
    country: "",
    sex: "",
    bio: "",
  });

  // useEffect initial pour charger l'utilisateur et les images
  useEffect(() => {
    if (userId) {
      dispatch(fetchUser());
      dispatch(getAllImagesByUserId(userId));
    }
  }, [userId, dispatch, navigate]);

  // useEffect pour synchroniser les données utilisateur et les images
  useEffect(() => {
    if (user) {
      const normalizedPhone = user.phone && !user.phone.startsWith("+") ? `+${user.phone}` : user.phone || "";
      const initialData = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: normalizedPhone,
        address: address || user.address || "",
        city: city || user.city || "",
        country: country || user.country || "",
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
        city: initialData.city,
        country: initialData.country,
        sex: initialData.sex,
        bio: initialData.bio,
      });
      setModalAddress(initialData.address);

      let profileImg: Image | null = null;
      if (Array.isArray(images) && images.length > 0) {
        profileImg = images.find((img) => img.isNSFW === false && img.name === "profile-picture.jpg") ||
          images.reduce((latest, current) =>
            new Date(current.uploadedAt || "1970-01-01") > new Date(latest.uploadedAt || "1970-01-01") ? current : latest,
            images[0]
          );
      }
      setProfileImage(profileImg || null);
      console.log("🔹 Profile image set to:", profileImg);
    }
  }, [user, images, address, latitude, longitude, city, country]);

  // useEffect pour Google Maps Autocomplete
  useEffect(() => {
    if (isGoogleMapsLoaded && autocompleteRef.current && isModalOpen) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
        types: ["address"],
        fields: ["formatted_address", "geometry", "address_components"],
      });

      const handlePlaceChange = () => {
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
          setFormData((prev) => ({
            ...prev,
            city,
            country,
          }));
          dispatch(updateGeolocation({ userId: user.id, latitude: newLatitude, longitude: newLongitude }));
        }
      };

      autocomplete.addListener("place_changed", handlePlaceChange);
    }
  }, [isGoogleMapsLoaded, isModalOpen, dispatch, user]);

  // Fonctions de gestion des changements
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handlePhoneChange = useCallback((phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
      alert(t("editProfile.invalidImage", "Please select a valid image file."));
    }
  };

  const handleImageUpload = async () => {
    if (!user || !selectedFile) return;

    setIsImageUploading(true);
    try {
      await dispatch(uploadImage({ userId: user.id, name: "profile-picture.jpg", file: selectedFile })).unwrap();
      dispatch(getAllImagesByUserId(user.id)); // Rafraîchir les images après l'upload
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("❌ Échec de l'upload de l'image :", error);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleDeleteImage = async (image: Image) => {
    if (!user || !image.name) return;

    try {
      await dispatch(deleteImage({ userId: user.id, name: image.name })).unwrap();
      dispatch(getAllImagesByUserId(user.id)); // Rafraîchir les images après suppression
    } catch (error) {
      console.error("❌ Échec de la suppression de l'image :", error);
    }
  };

  const hasChanges = useCallback(() => {
    return (
      formData.firstName !== initialFormData.firstName ||
      formData.lastName !== initialFormData.lastName ||
      formData.phone !== initialFormData.phone ||
      formData.address !== initialFormData.address ||
      formData.city !== initialFormData.city ||
      formData.country !== initialFormData.country ||
      formData.sex !== initialFormData.sex ||
      formData.bio !== initialFormData.bio ||
      latitude !== initialFormData.latitude ||
      longitude !== initialFormData.longitude
    );
  }, [formData, initialFormData, latitude, longitude]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && hasChanges()) {
      const payload = {
        id: user.id,
        ...formData,
        latitude,
        longitude,
      };
      dispatch(updateUser(payload));
    }
  };

  const handleUpdateAddress = useCallback(async () => {
    if (user && (latitude || longitude)) {
      setIsAddressLoading(true);
      await dispatch(updateUserAddress(user.id))
        .unwrap()
        .then((updatedUser) => {
          setFormData((prev) => ({
            ...prev,
            address: updatedUser.address || prev.address,
            city: updatedUser.city || prev.city,
            country: updatedUser.country || prev.country,
          }));
          setModalAddress(updatedUser.address || "");
        })
        .catch((error) => {
          console.error("❌ Erreur lors de la mise à jour de l’adresse :", error);
        });
      setIsAddressLoading(false);
    }
  }, [dispatch, user, latitude, longitude]);

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

      {status === "loading" && !isAddressLoading && !isImageUploading && <p>{t("editProfile.loading", "Loading...")}</p>}
      {error && <p className="error">{t("editProfile.error", { message: error })}</p>}
      {googleMapsError && <p className="error">{t("editProfile.googleMapsError", { message: googleMapsError })}</p>}
      {loadError && <p className="error">{t("editProfile.googleMapsLoadError", { message: loadError })}</p>}
      {message && <p className="success">{t("editProfile.success", "Profile updated successfully")}</p>}
      {imageStatus === "loading" && <p>{t("editProfile.uploadingImage", "Uploading image...")}</p>}
      {imageError && <p className="error">{t("editProfile.imageError", { message: imageError })}</p>}
      {imageMessage && <p className="success">{t("editProfile.imageSuccess", "Image uploaded successfully")}</p>}
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

        <label>{t("editProfile.city", "City")} :</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder={t("editProfile.cityPlaceholder", "Your city")}
          disabled
        />

        <label>{t("editProfile.country", "Country")} :</label>
        <input
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          placeholder={t("editProfile.countryPlaceholder", "Your country")}
          disabled
        />

        <label>{t("editProfile.sex", "Sex")} :</label>
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="">{t("editProfile.sexOptions.unspecified", "Not specified")}</option>
          <option value="Man">{t("editProfile.sexOptions.man", "Man")}</option>
          <option value="Woman">{t("editProfile.sexOptions.woman", "Woman")}</option>
          <option value="Other">{t("editProfile.sexOptions.other", "Other")}</option>
        </select>

        <label>{t("editProfile.bio", "Bio")} :</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} />

        <label>{t("editProfile.profilePicture", "Profile Picture")} :</label>
        <div className="image-section">
          {profileImage && (
            <img
              src={`http://localhost:7000/${profileImage.path}`}
              alt={t("editProfile.profilePreview", "Profile Picture Preview")}
              style={{ maxWidth: "200px", marginBottom: "10px" }}
            />
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            disabled={isImageUploading}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt={t("editProfile.preview", "Image Preview")} style={{ maxWidth: "200px", marginTop: "10px" }} />
              <button type="button" onClick={handleImageUpload} disabled={isImageUploading}>
                {isImageUploading ? t("editProfile.uploading", "Uploading...") : t("editProfile.upload", "Upload Image")}
              </button>
            </div>
          )}
          {images.length > 0 && (
            <div className="existing-images">
              <h3>{t("editProfile.existingImages", "Your Images")}</h3>
              <div className="images-grid">
                {images.map((image) => (
                  <div key={image.name} className="image-item">
                    <img
                      src={`http://localhost:7000/${image.path}`}
                      alt={image.name}
                      className="existing-image"
                    />
                    <i
                      className="fas fa-times delete-icon"
                      onClick={() => handleDeleteImage(image)}
                      title={t("editProfile.deleteImage", "Delete Image")}
                    />
                    {image.isNSFW && <span className="nsfw-label">{t("editProfile.nsfw", "NSFW")}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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

      <button onClick={() => navigate("/profile")} disabled={status === "loading" || isImageUploading}>
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