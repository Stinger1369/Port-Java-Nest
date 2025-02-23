import { useEffect, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser } from "../../redux/features/userSlice"; // ✅ Retiré fetchWeather et updateGeolocation
import { useTranslation } from "react-i18next";
import "./Profile.css";

const Profile = () => {
  const { t, i18n, ready } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!user && status === "idle") {
      dispatch(fetchUser());
    }
  }, [token, user, status, navigate, dispatch]);

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

  if (!ready) {
    return <div>{t("loading", "Loading translations...")}</div>;
  }

  if (status === "loading") return <div className="profile-loading">{t("profile.loading", "Loading data...")}</div>;
  if (status === "failed") return <div className="profile-error">{t("profile.error", { message: error })}</div>;

  return (
    <div className={`profile-container ${i18n.language === "ar" ? "rtl" : ""}`}>
      <h2 className="profile-title">{t("profile.title", "My Profile")}</h2>
      {user ? (
        <div className="profile-card">
          <ul className="profile-details">
            <li>
              <i className="fas fa-user"></i>
              <span>
                <span className="label">{t("profile.name", "Name")} :</span> {user.firstName} {user.lastName}
              </span>
            </li>
            <li>
              <i className="fas fa-envelope"></i>
              <span>
                <span className="label">{t("profile.email", "Email")} :</span> {user.email}
              </span>
            </li>
            <li>
              <i className="fas fa-phone"></i>
              <span>
                <span className="label">{t("profile.phone", "Phone")} :</span>{" "}
                {user.phone || t("profile.unspecified", "Not provided")}
              </span>
            </li>
            <li>
              <i className="fas fa-map-marker-alt"></i>
              <span>
                <span className="label">{t("profile.address", "Address")} :</span>{" "}
                {user.address || t("profile.unspecified", "Not provided")}
              </span>
            </li>
            <li>
              <i className="fas fa-city"></i>
              <span>
                <span className="label">{t("profile.city", "City")} :</span>{" "}
                {user.city || t("profile.unspecified", "Not provided")}
              </span>
            </li>
            <li>
              <i className="fas fa-globe"></i>
              <span>
                <span className="label">{t("profile.country", "Country")} :</span>{" "}
                {user.country || t("profile.unspecified", "Not provided")}
              </span>
            </li>
            <li>
              <i className="fas fa-venus-mars"></i>
              <span>
                <span className="label">{t("profile.sex", "Sex")} :</span> {getSexLabel(user.sex)}
              </span>
            </li>
            <li>
              <i className="fas fa-book"></i>
              <span>
                <span className="label">{t("profile.bio", "Biography")} :</span>{" "}
                {user.bio || t("profile.noBio", "No biography")}
              </span>
            </li>
            <li>
              <i className="fas fa-map-pin"></i>
              <span>
                <span className="label">{t("profile.location", "Location")} :</span>{" "}
                {user.latitude && user.longitude
                  ? `${user.latitude}, ${user.longitude}`
                  : t("profile.noLocation", "Not provided")}
              </span>
            </li>
          </ul>
          <button className="profile-edit-btn" onClick={() => navigate("/edit-profile")}>
            <i className="fas fa-edit"></i> {t("profile.edit", "Edit my profile")}
          </button>
        </div>
      ) : (
        <p className="profile-empty">{t("profile.notFound", "User not found.")}</p>
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