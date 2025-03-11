import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import { uploadImage, getAllImagesByUserId, deleteImage, setProfilePicture } from "../../../../redux/features/imageSlice";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // Importez les icônes
import "./ImagesScreen.css";

interface Image {
  id: string | null;
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean;
  isProfilePicture: boolean;
  uploadedAt: string | null;
}

interface Props {
  onBack?: () => void;
  onNext?: () => void;
}

const ImagesScreen = ({ onBack, onNext }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const images = useSelector((state: RootState) => state.image.images);
  const imageStatus = useSelector((state: RootState) => state.image.status);
  const imageError = useSelector((state: RootState) => state.image.error);
  const imageMessage = useSelector((state: RootState) => state.image.message);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(getAllImagesByUserId(userId));
    }
  }, [dispatch]);

  useEffect(() => {
    console.log("🔍 Images dans le state:", images);
    images.forEach((img, index) => {
      console.log(`Image ${index}:`, { id: img.id, name: img.name, isProfilePicture: img.isProfilePicture });
    });
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
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
      const hasProfilePicture = images.some((img) => img.isProfilePicture);
      await dispatch(
        uploadImage({
          userId: user.id,
          name: `${Date.now()}_profile-picture.jpg`,
          file: selectedFile,
          isProfilePicture: !hasProfilePicture,
        })
      ).unwrap();
      await dispatch(getAllImagesByUserId(user.id)).unwrap();
      setSelectedFile(null);
      setImagePreview(null);
      console.log("✅ Image uploadée avec succès");
    } catch (error) {
      console.error("❌ Échec de l'upload de l'image :", error);
      alert(t("editProfile.uploadError", "Failed to upload image."));
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleDeleteImage = async (image: Image) => {
    if (!user || !image.name) return;

    try {
      await dispatch(deleteImage({ userId: user.id, name: image.name })).unwrap();
      await dispatch(getAllImagesByUserId(user.id)).unwrap();
      console.log("✅ Image supprimée avec succès:", image.name);
    } catch (error) {
      console.error("❌ Échec de la suppression de l'image :", error);
      alert(t("editProfile.deleteError", "Failed to delete image."));
    }
  };

  const handleSetProfilePicture = async (imageId: string | null) => {
    if (!imageId || !user) {
      console.error("❌ imageId ou user manquant:", { imageId, user });
      return;
    }

    console.log("🔹 Début de handleSetProfilePicture pour imageId:", imageId);
    try {
      const result = await dispatch(setProfilePicture(imageId)).unwrap();
      console.log("✅ Réponse de setProfilePicture:", result);
      await dispatch(getAllImagesByUserId(user.id)).unwrap();
      setSuccessMessage(t("editProfile.profileUpdated", "Image updated as default profile picture."));
      console.log("✅ Photo de profil définie avec succès pour imageId:", imageId);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("❌ Échec de handleSetProfilePicture:", error);
      alert(t("editProfile.profilePictureError", "Failed to set profile picture. Please try again."));
    }
  };

  return (
    <div className="images-screen">
      <h3>{t("editProfile.images", "Manage Images")}</h3>

      {imageStatus === "loading" && <p>{t("editProfile.uploadingImage", "Uploading image...")}</p>}
      {imageError && <p className="error">{t("editProfile.imageError", { message: imageError })}</p>}
      {imageMessage && <p className="success">{imageMessage}</p>}
      {successMessage && <p className="success">{successMessage}</p>}

      <label>{t("editProfile.profilePicture", "Profile Picture")} :</label>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        disabled={isImageUploading}
      />
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt={t("editProfile.preview", "Image Preview")} className="preview-image" />
          <button type="button" onClick={handleImageUpload} disabled={isImageUploading}>
            {isImageUploading
              ? t("editProfile.uploading", "Uploading...")
              : t("editProfile.upload", "Upload Image")}
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="existing-images">
          <h4>{t("editProfile.existingImages", "Your Images")}</h4>
          <div className="images-grid">
            {images.map((image, index) => (
              <div
                key={image.id || `${image.name}-${index}`}
                className={`image-item ${image.isProfilePicture ? "profile-picture" : ""}`}
              >
                <img
                  src={`http://localhost:7000/${image.path}`}
                  alt={image.name}
                  className="existing-image"
                />
                <div className="image-actions">
                  <i
                    className="fas fa-times delete-icon"
                    onClick={() => handleDeleteImage(image)}
                    title={t("editProfile.deleteImage", "Delete Image")}
                  />
                  <i
                    className={`fas fa-user-circle set-profile-icon ${image.isProfilePicture ? "active" : ""}`}
                    onClick={!image.isProfilePicture ? () => handleSetProfilePicture(image.id) : undefined}
                    title={
                      image.isProfilePicture
                        ? t("editProfile.currentProfile", "Profile Picture")
                        : t("editProfile.setProfilePicture", "Set as Profile Picture")
                    }
                  />
                </div>
                {image.isProfilePicture && (
                  <span className="profile-label">{t("editProfile.currentProfile", "Profile Picture")}</span>
                )}
                {image.isNSFW && <span className="nsfw-label">{t("editProfile.nsfw", "NSFW")}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {images.length === 0 && <p>{t("editProfile.noImages", "No images yet")}</p>}

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

export default ImagesScreen;