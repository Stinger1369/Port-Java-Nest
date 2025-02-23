import { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useTranslation } from "react-i18next";
import { parsePhoneNumberFromString, getCountryCallingCode } from "libphonenumber-js";
import "./PhoneInputComponent.css";

interface PhoneInputComponentProps {
  value: string;
  onChange: (phone: string) => void;
  label: string;
}

const PhoneInputComponent = ({ value, onChange, label }: PhoneInputComponentProps) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(value); // Numéro complet (indicatif + numéro)
  const [countryCode, setCountryCode] = useState("fr"); // Code pays (ex. : "fr")
  const [userNumber, setUserNumber] = useState(""); // Numéro utilisateur sans indicatif
  const [error, setError] = useState<string | null>(null); // Message d’erreur

  // Synchronisation avec la prop value au chargement
  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed && parsed.isValid()) {
        setCountryCode(parsed.country?.toLowerCase() || "fr");
        setUserNumber(parsed.nationalNumber);
        setPhone(value);
      } else {
        const normalizedValue = value.startsWith("+") ? value : `+${value}`;
        setPhone(normalizedValue);
        setUserNumber(normalizedValue.replace(/^\+\d{1,3}/, ""));
      }
    }
  }, [value]);

  // Gestion de la sélection du pays
  const handleCountryChange = (country: string) => {
    const newIndicatif = `+${getCountryCallingCode(country.toUpperCase())}`; // Utilise libphonenumber-js pour l’indicatif
    const newPhone = userNumber ? `${newIndicatif}${userNumber}` : newIndicatif;
    setCountryCode(country);
    setPhone(newPhone);
    onChange(newPhone);
    console.log("Nouveau pays sélectionné:", country, "Numéro complet:", newPhone);
  };

  // Gestion du changement de numéro utilisateur
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, ""); // Accepte uniquement les chiffres
    setUserNumber(input);

    const indicatif = `+${getCountryCallingCode(countryCode.toUpperCase())}`; // Indicatif dynamique
    const newPhone = `${indicatif}${input}`;

    const phoneNumber = parsePhoneNumberFromString(newPhone);
    if (phoneNumber && phoneNumber.isValid()) {
      setError(null);
      setPhone(newPhone);
      onChange(newPhone);
      console.log("Numéro valide envoyé au parent:", newPhone);
    } else if (input.length > 0) {
      setError(t("editProfile.phoneError", "Please enter a valid phone number."));
      setPhone(newPhone);
      onChange(""); // Invalide la saisie jusqu’à correction
      console.log("Numéro invalide, envoyé au parent: ''");
    } else {
      setError(null);
      setPhone(newPhone);
      onChange(newPhone);
      console.log("Numéro vide envoyé au parent:", newPhone);
    }
  };

  return (
    <div className="phone-input-container">
      <label>{label} :</label>
      <div className="phone-input-group">
        <PhoneInput
          country={countryCode}
          value={phone}
          onChange={() => {}} // Désactive l’édition directe via PhoneInput
          enableSearch={true} // Active la recherche dans le dropdown
          disableDropdown={false} // Permet de changer de pays à tout moment
          countryCodeEditable={false} // Indicatif non éditable manuellement
          inputProps={{
            disabled: true, // Désactive l’édition directe dans PhoneInput
          }}
          containerClass="phone-input-prefix"
          inputClass="phone-input-hidden"
          onCountryChange={handleCountryChange} // Gère la sélection du pays
          searchPlaceholder={t("editProfile.searchCountry", "Search country")} // Placeholder pour la recherche
        />
        <input
          type="text"
          value={userNumber}
          onChange={handleNumberChange}
          placeholder={t("editProfile.phoneNumberPlaceholder", "Enter phone number (e.g., 659165303)")}
          className="phone-number-input"
          maxLength={15} // Limite raisonnable pour les numéros
        />
      </div>
      {error && <p className="phone-error">{error}</p>}
    </div>
  );
};

export default PhoneInputComponent;