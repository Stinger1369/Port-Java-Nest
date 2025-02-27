import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import { uploadImage, getAllImagesByUserId, deleteImage } from "../../../../redux/features/imageSlice";
import { useTranslation } from "react-i18next";
import "./ImagesScreen.css";
interface Image {
  id: string | null;
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean;
  uploadedAt: string | null;
}

const ImagesScreen = () => {
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

  // Charger les images existantes au montage du composant
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(getAllImagesByUserId(userId));
    }
  }, [dispatch]);

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

  return (
    <div className="images-screen">
      <h3>{t("editProfile.images", "Manage Images")}</h3>

      {/* Messages de statut */}
      {imageStatus === "loading" && <p>{t("editProfile.uploadingImage", "Uploading image...")}</p>}
      {imageError && <p className="error">{t("editProfile.imageError", { message: imageError })}</p>}
      {imageMessage && <p className="success">{t("editProfile.imageSuccess", "Image uploaded successfully")}</p>}

      {/* Upload d'image */}
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
          <img
            src={imagePreview}
            alt={t("editProfile.preview", "Image Preview")}
            style={{ maxWidth: "200px", marginTop: "10px" }}
          />
          <button type="button" onClick={handleImageUpload} disabled={isImageUploading}>
            {isImageUploading
              ? t("editProfile.uploading", "Uploading...")
              : t("editProfile.upload", "Upload Image")}
          </button>
        </div>
      )}

      {/* Affichage des images existantes */}
      {images.length > 0 && (
        <div className="existing-images">
          <h4>{t("editProfile.existingImages", "Your Images")}</h4>
          <div className="images-grid">
            {images.map((image) => (
              <div key={image.name} className="image-item">
                <img
                  src={`http://localhost:7000/${image.path}`}
                  alt={image.name}
                  className="existing-image"
                  style={{ maxWidth: "100px" }}
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
      {images.length === 0 && <p>{t("editProfile.noImages", "No images yet")}</p>}
    </div>
  );
};

export default ImagesScreen;