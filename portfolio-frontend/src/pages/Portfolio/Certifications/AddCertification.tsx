import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addCertification, fetchCertificationsByUser } from "../../../redux/features/certificationSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Certifications.css";

interface Props {
  onClose: () => void;
}

const AddCertification = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [certification, setCertification] = useState({
    name: "",
    organization: "",
    dateObtained: "",
    expirationDate: "",
    doesNotExpire: false,
    credentialId: "",
    credentialUrl: "",
    isPublic: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Nouveau state pour le succès
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Nouveau state pour les erreurs

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCertification((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setCertification((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      setErrorMessage("Erreur : ID utilisateur manquant.");
      return;
    }

    const certificationData = certification.doesNotExpire
      ? { ...certification, expirationDate: null }
      : certification;

    dispatch(addCertification({ ...certificationData, userId }))
      .unwrap()
      .then(() => {
        setSuccessMessage("Certification ajoutée avec succès !");
        dispatch(fetchCertificationsByUser(userId));
        setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'ajout de la certification:", err);
        setErrorMessage("Erreur lors de l’ajout de la certification.");
      });
  };

  // Efface les messages après 3 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="modal">
      <div className="certification-form-container">
        <h3 className="certification-form-title">Ajouter une Certification</h3>
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="certification-label">Nom de la certification *</label>
          <input
            type="text"
            name="name"
            value={certification.name}
            onChange={handleChange}
            placeholder="Nom de la certification"
            required
            className="certification-input"
          />

          <label className="certification-label">Organisme *</label>
          <input
            type="text"
            name="organization"
            value={certification.organization}
            onChange={handleChange}
            placeholder="Organisme"
            required
            className="certification-input"
          />

          <label className="certification-label">Date d'obtention *</label>
          <DatePicker
            name="dateObtained"
            value={certification.dateObtained}
            onChange={handleDateChange}
            required
            className="certification-date-picker"
          />

          {!certification.doesNotExpire && (
            <>
              <label className="certification-label">Date d'expiration</label>
              <DatePicker
                name="expirationDate"
                value={certification.expirationDate}
                onChange={handleDateChange}
                className="certification-date-picker"
              />
            </>
          )}

          <label className="certification-checkbox-label">
            <input
              type="checkbox"
              name="doesNotExpire"
              checked={certification.doesNotExpire}
              onChange={handleChange}
            />
            Cette certification n'expire pas
          </label>

          <label className="certification-label">Identifiant de la certification</label>
          <input
            type="text"
            name="credentialId"
            value={certification.credentialId}
            onChange={handleChange}
            placeholder="Identifiant de la certification"
            className="certification-input"
          />

          <label className="certification-label">URL de la certification</label>
          <input
            type="text"
            name="credentialUrl"
            value={certification.credentialUrl}
            onChange={handleChange}
            placeholder="URL de la certification"
            className="certification-input"
          />

          <label className="certification-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={certification.isPublic}
              onChange={handleChange}
            />
            Public
          </label>

          <button type="submit" className="certification-button certification-button-submit">
            Ajouter
          </button>
          <button
            type="button"
            onClick={onClose}
            className="certification-button certification-button-cancel"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCertification;