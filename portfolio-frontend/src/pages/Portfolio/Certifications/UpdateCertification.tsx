import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateCertification, fetchCertificationsByUser } from "../../../redux/features/certificationSlice";
import DatePicker from "../../../components/common/DatePicker";
import "./Certifications.css";

interface Certification {
  id: string;
  name?: string;
  organization?: string;
  dateObtained?: string;
  expirationDate?: string | null;
  doesNotExpire?: boolean;
  credentialId?: string;
  credentialUrl?: string;
  isPublic?: boolean;
}

interface Props {
  certification: Certification;
  onClose: () => void;
}

const UpdateCertification = ({ certification, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedCertification, setUpdatedCertification] = useState<Certification>({
    id: certification.id,
    name: certification.name || "",
    organization: certification.organization || "",
    dateObtained: certification.dateObtained || "",
    expirationDate: certification.expirationDate || "",
    doesNotExpire: certification.doesNotExpire || false,
    credentialId: certification.credentialId || "",
    credentialUrl: certification.credentialUrl || "",
    isPublic: certification.isPublic || false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Nouveau state pour le succès
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Nouveau state pour les erreurs

  useEffect(() => {
    if (certification) {
      setUpdatedCertification({
        id: certification.id,
        name: certification.name || "",
        organization: certification.organization || "",
        dateObtained: certification.dateObtained || "",
        expirationDate: certification.expirationDate || "",
        doesNotExpire: certification.doesNotExpire || false,
        credentialId: certification.credentialId || "",
        credentialUrl: certification.credentialUrl || "",
        isPublic: certification.isPublic || false,
      });
    }
  }, [certification]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedCertification((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setUpdatedCertification((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (userId) {
      const certificationData = updatedCertification.doesNotExpire
        ? { ...updatedCertification, expirationDate: null }
        : updatedCertification;

      dispatch(updateCertification({ id: updatedCertification.id, certificationData }))
        .unwrap()
        .then(() => {
          setSuccessMessage("Certification mise à jour avec succès !");
          dispatch(fetchCertificationsByUser(userId));
          setTimeout(() => onClose(), 3000); // Ferme après 3 secondes
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la certification:", err);
          setErrorMessage("Erreur lors de la mise à jour de la certification.");
        });
    }
  };

  return (
    <div className="modal">
      <div className="certification-form-container">
        <h3 className="certification-form-title">Modifier la Certification</h3>
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
            value={updatedCertification.name}
            onChange={handleChange}
            required
            placeholder="Nom de la certification"
            className="certification-input"
          />

          <label className="certification-label">Organisme *</label>
          <input
            type="text"
            name="organization"
            value={updatedCertification.organization}
            onChange={handleChange}
            required
            placeholder="Organisme"
            className="certification-input"
          />

          <label className="certification-label">Date d'obtention *</label>
          <DatePicker
            name="dateObtained"
            value={updatedCertification.dateObtained}
            onChange={handleDateChange}
            required
            className="certification-date-picker"
          />

          {!updatedCertification.doesNotExpire && (
            <>
              <label className="certification-label">Date d'expiration</label>
              <DatePicker
                name="expirationDate"
                value={updatedCertification.expirationDate || ""}
                onChange={handleDateChange}
                className="certification-date-picker"
              />
            </>
          )}

          <label className="certification-checkbox-label">
            <input
              type="checkbox"
              name="doesNotExpire"
              checked={updatedCertification.doesNotExpire}
              onChange={handleChange}
            />
            Cette certification n'expire pas
          </label>

          <label className="certification-label">Identifiant de la certification</label>
          <input
            type="text"
            name="credentialId"
            value={updatedCertification.credentialId}
            onChange={handleChange}
            placeholder="Identifiant de la certification"
            className="certification-input"
          />

          <label className="certification-label">URL de la certification</label>
          <input
            type="text"
            name="credentialUrl"
            value={updatedCertification.credentialUrl}
            onChange={handleChange}
            placeholder="URL de la certification"
            className="certification-input"
          />

          <label className="certification-checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={updatedCertification.isPublic}
              onChange={handleChange}
            />
            Public
          </label>

          <button type="submit" className="certification-button certification-button-submit">
            Mettre à jour
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

export default UpdateCertification;