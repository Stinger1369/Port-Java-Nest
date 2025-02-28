import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";
import { useTranslation } from "react-i18next";
import PhoneInputComponent from "../../../../components/PhoneInput/PhoneInputComponent";
import "./PersonalInfoScreen.css";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
}

const PersonalInfoScreen = ({ formData, setFormData }: Props) => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user.user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (phone: string) => {
    setFormData({ ...formData, phone });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log("🔹 Mise à jour de showBirthdate :", newValue); // Log pour débogage
    setFormData({ ...formData, [e.target.name]: newValue });
  };

  return (
    <div className="personal-info-screen">
      <h3>{t("editProfile.personalInfo", "Personal Information")}</h3>
      <label>{t("editProfile.firstName", "First Name")} :</label>
      <input
        type="text"
        name="firstName"
        value={formData.firstName || user?.firstName || ""}
        onChange={handleChange}
      />
      <label>{t("editProfile.lastName", "Last Name")} :</label>
      <input
        type="text"
        name="lastName"
        value={formData.lastName || user?.lastName || ""}
        onChange={handleChange}
      />
      <PhoneInputComponent
        value={formData.phone || user?.phone || ""}
        onChange={handlePhoneChange}
        label={t("editProfile.phone", "Phone")}
      />
      <label>{t("editProfile.sex", "Sex")} :</label>
      <select name="sex" value={formData.sex || user?.sex || ""} onChange={handleChange}>
        <option value="">{t("editProfile.sexOptions.unspecified", "Not specified")}</option>
        <option value="Man">{t("editProfile.sexOptions.man", "Man")}</option>
        <option value="Woman">{t("editProfile.sexOptions.woman", "Woman")}</option>
        <option value="Other">{t("editProfile.sexOptions.other", "Other")}</option>
      </select>
      <label>{t("editProfile.birthdate", "Birthdate")} :</label>
      <input
        type="date"
        name="birthdate"
        value={formData.birthdate || user?.birthdate || ""}
        onChange={handleChange}
      />
      <label>
        <input
          type="checkbox"
          name="showBirthdate"
          checked={formData.showBirthdate ?? user?.showBirthdate ?? false}
          onChange={handleCheckboxChange}
        />
        {t("editProfile.showBirthdate", "Show birthdate and age")}
      </label>
      <label>{t("editProfile.bio", "Bio")} :</label>
      <textarea name="bio" value={formData.bio || user?.bio || ""} onChange={handleChange} />
    </div>
  );
};

export default PersonalInfoScreen;