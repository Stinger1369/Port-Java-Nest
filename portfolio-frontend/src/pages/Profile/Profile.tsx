import { useEffect, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser } from "../../redux/features/userSlice";
import { getAllImagesByUserId } from "../../redux/features/imageSlice";
import { useTranslation } from "react-i18next";
import "./Profile.css";

interface Image {
  id: string | null;
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean;
  uploadedAt: string | null;
}

const Profile = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);
  const images = useSelector((state: RootState) => state.image.images);
  const imageStatus = useSelector((state: RootState) => state.image.status);
  const imageError = useSelector((state: RootState) => state.image.error);

  const [profileImage, setProfileImage] = useState<Image | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null); // État pour l'image agrandie

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!user && status === "idle") {
      dispatch(fetchUser());
    }
  }, [token, user, status, navigate, dispatch]);

  useEffect(() => {
    if (userId && token) {
      dispatch(getAllImagesByUserId(userId));
    }
  }, [userId, token, dispatch]);

  useEffect(() => {
    if (images.length > 0) {
      const profileImg = images.find((img) => img.name === "profile-picture.jpg" && !img.isNSFW) ||
        images.reduce((latest, current) =>
          new Date(current.uploadedAt || "1970-01-01") > new Date(latest.uploadedAt || "1970-01-01") ? current : latest,
          images[0]
        );
      setProfileImage(profileImg || null);
      console.log("🔹 Image de profil trouvée dans Profile.tsx :", profileImg);
    } else {
      setProfileImage(null);
      console.log("🔹 Aucune image trouvée pour l'utilisateur dans Profile.tsx");
    }
  }, [images]);

  useEffect(() => {
    if (user) {
      console.log("🔹 Utilisateur récupéré dans Profile.tsx :", {
        id: user.id,
        sex: user.sex,
        bio: user.bio,
      });
    }
  }, [user]);

  const getSexLabel = (sex: string | undefined) => {
    switch (sex) {
      case "Man":
        return t("profile.sexOptions.man", "Man");
      case "Woman":
        return t("profile.sexOptions.woman", "Woman");
      case "Other":
        return t("profile.sexOptions.other", "Other");
      default:
        return t("profile.sexOptions.unspecified", "Not specified");
    }
  };

  // Ouvre l'image en grand
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  // Ferme la modale
  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  if (status === "loading" || imageStatus === "loading") {
    return <div className="profile-loading">{t("profile.loading", "Loading...")}</div>;
  }

  if (status === "failed") {
    return <div className="profile-error">{t("profile.error", { message: error })}</div>;
  }

  if (imageStatus === "failed") {
    return <div className="profile-error">{t("profile.imageError", { message: imageError })}</div>;
  }

  return (
    <div className={`profile-container ${i18n.language === "ar" ? "rtl" : "ltr"}`}>
      <div className="profile-card">
        {/* Header avec les images */}
        <div className="profile-header">
          <h2 className="profile-title">{t("profile.title", "My Profile")}</h2>
          <div className="profile-images-grid">
            {images.length > 0 ? (
              <div className="images-container">
                {images.map((image) => (
                  <div
                    key={image.name}
                    className="image-item"
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={`http://localhost:7000/${image.path}`}
                      alt={image.name}
                      className="user-image"
                    />
                    {image.isNSFW && <span className="nsfw-label">{t("profile.nsfw", "NSFW")}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-images">{t("profile.noImages", "No images yet")}</p>
            )}
          </div>
        </div>

        {/* Détails du profil */}
        {user ? (
          <div className="profile-details-container">
            <div className="profile-avatar">
              {profileImage ? (
                <img
                  src={`http://localhost:7000/${profileImage.path}`}
                  alt={t("profile.profilePicture", "Profile Picture")}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <i className="fas fa-user-circle"></i>
                </div>
              )}
            </div>
            <ul className="profile-details-list">
              <li>
                <span className="label">{t("profile.name", "Name")}</span>
                <span className="value">{user.firstName} {user.lastName}</span>
              </li>
              <li>
                <span className="label">{t("profile.email", "Email")}</span>
                <span className="value">{user.email}</span>
              </li>
              <li>
                <span className="label">{t("profile.phone", "Phone")}</span>
                <span className="value">{user.phone || t("profile.unspecified", "Not provided")}</span>
              </li>
              <li>
                <span className="label">{t("profile.address", "Address")}</span>
                <span className="value">{user.address || t("profile.unspecified", "Not provided")}</span>
              </li>
              <li>
                <span className="label">{t("profile.city", "City")}</span>
                <span className="value">{user.city || t("profile.unspecified", "Not provided")}</span>
              </li>
              <li>
                <span className="label">{t("profile.country", "Country")}</span>
                <span className="value">{user.country || t("profile.unspecified", "Not provided")}</span>
              </li>
              <li>
                <span className="label">{t("profile.sex", "Sex")}</span>
                <span className="value">{getSexLabel(user.sex)}</span>
              </li>
              <li>
                <span className="label">{t("profile.bio", "Bio")}</span>
                <span className="value">{user.bio || t("profile.noBio", "No biography")}</span>
              </li>
            </ul>
            <button className="profile-edit-btn" onClick={() => navigate("/edit-profile")}>
              {t("profile.edit", "Edit Profile")}
            </button>
          </div>
        ) : (
          <p className="profile-empty">{t("profile.notFound", "User not found.")}</p>
        )}
      </div>

      {/* Modale pour afficher l'image en grand */}
      {selectedImage && (
        <div className="image-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={`http://localhost:7000/${selectedImage.path}`}
              alt={selectedImage.name}
              className="modal-image"
            />
            <span className="modal-close" onClick={handleCloseModal}>✕</span>
            <p className="modal-name">{selectedImage.name}</p>
            {selectedImage.isNSFW && <span className="modal-nsfw">{t("profile.nsfw", "NSFW")}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <Profile />
  </Suspense>
);

export default ProfileWithSuspense;