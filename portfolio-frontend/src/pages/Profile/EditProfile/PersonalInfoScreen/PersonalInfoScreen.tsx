import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";
import { useTranslation } from "react-i18next";
import PhoneInputComponent from "../../../../components/PhoneInput/PhoneInputComponent";
import DatePicker from "../../../../components/common/DatePicker";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "./PersonalInfoScreen.css";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  onBack?: () => void;
  onNext?: () => void;
}

const PersonalInfoScreen = ({ formData, setFormData, onBack, onNext }: Props) => {
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
    console.log("🔹 Mise à jour de showBirthdate :", newValue);
    setFormData({ ...formData, [e.target.name]: newValue });
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // Vérifie si birthdate est défini (non vide et valide)
  const isBirthdateSet = !!formData.birthdate && formData.birthdate.trim() !== "";

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

      <DatePicker
        name="birthdate"
        value={formData.birthdate || user?.birthdate || ""}
        onChange={handleDateChange}
        label={t("editProfile.birthdate", "Birthdate") + " :"}
      />
 {/* Checkbox avant le DatePicker */}
      <label className={!isBirthdateSet ? "disabled-label" : ""}>
        <input
          type="checkbox"
          name="showBirthdate"
          checked={formData.showBirthdate ?? user?.showBirthdate ?? false}
          onChange={handleCheckboxChange}
          disabled={!isBirthdateSet}
        />
        {t("editProfile.showBirthdate", "Show birthdate and age")}
      </label>
      <label>{t("editProfile.bio", "Bio")} :</label>
      <textarea name="bio" value={formData.bio || user?.bio || ""} onChange={handleChange} />
      <div className="navigation-buttons">
        <button className="nav-button back-button" onClick={onBack} title={t("editProfile.backToProfile", "Back to Profile")}>
          <FaArrowLeft />
        </button>
        <button className="nav-button next-button" onClick={onNext} title={t("editProfile.next", "Next")}>
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoScreen;