import { useState, useEffect, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser, updateUser } from "../../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import PhoneInputComponent from "../../../components/PhoneInput/PhoneInputComponent";
import "./EditProfile.css";

const EditProfile = () => {
  const { t, ready } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);
  const message = useSelector((state: RootState) => state.user.message);

  const userId = localStorage.getItem("userId");

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

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!user && userId) {
      dispatch(fetchUser());
    } else if (user) {
      const normalizedPhone = user.phone && !user.phone.startsWith("+") ? `+${user.phone}` : user.phone || "";
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: normalizedPhone,
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        sex: user.sex || "",
        bio: user.bio || "",
      });
      console.log("Initial phone from user:", user.phone);
      console.log("Normalized phone in formData:", normalizedPhone);
    }
  }, [token, user, userId, dispatch, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (phone: string) => {
    setFormData({ ...formData, phone });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted phone:", formData.phone);
    if (user) {
      dispatch(updateUser({ id: user.id, ...formData }));
    }
  };

  if (!ready) {
    return <div>{t("loading", "Loading translations...")}</div>;
  }

  return (
    <div className="edit-profile-container">
      <h2>{t("editProfile.title", "Edit Profile")}</h2>

      {status === "loading" && <p>{t("editProfile.loading", "Loading...")}</p>}
      {error && <p className="error">{t("editProfile.error", { message: error })}</p>}
      {message && <p className="success">{t("editProfile.success", "Profile updated successfully")}</p>}

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
        <input type="text" name="address" value={formData.address} onChange={handleChange} />

        <label>{t("editProfile.city", "City")} :</label>
        <input type="text" name="city" value={formData.city} onChange={handleChange} />

        <label>{t("editProfile.country", "Country")} :</label>
        <input type="text" name="country" value={formData.country} onChange={handleChange} />

        <label>{t("editProfile.sex", "Sex")} :</label>
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="">{t("editProfile.sexOptions.unspecified", "Not specified")}</option>
          <option value="Man">{t("editProfile.sexOptions.man", "Man")}</option>
          <option value="Woman">{t("editProfile.sexOptions.woman", "Woman")}</option>
          <option value="Other">{t("editProfile.sexOptions.other", "Other")}</option>
        </select>

        <label>{t("editProfile.bio", "Bio")} :</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} />

        <button type="submit">{t("editProfile.submit", "Save")}</button>
      </form>

      <button onClick={() => navigate("/profile")}>
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