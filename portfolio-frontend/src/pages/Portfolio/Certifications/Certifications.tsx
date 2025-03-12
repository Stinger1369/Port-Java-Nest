import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import {
  fetchCertificationsByUser,
  deleteCertification,
  updateCertification,
} from "../../../redux/features/certificationSlice";
import AddCertification from "./AddCertification";
import UpdateCertification from "./UpdateCertification";
import "./Certifications.css";

const Certifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const certifications = useSelector((state: RootState) => state.certification.certifications) || [];
  const status = useSelector((state: RootState) => state.certification.status);
  const error = useSelector((state: RootState) => state.certification.error);
  const userId = localStorage.getItem("userId");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Nouveau state pour le succès
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Nouveau state pour les erreurs

  useEffect(() => {
    if (userId) {
      dispatch(fetchCertificationsByUser(userId));
    }
  }, [dispatch, userId]);

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

  const handleTogglePublic = (certificationId: string) => {
    const certification = certifications.find((cert) => cert.id === certificationId);
    if (certification && userId) {
      dispatch(
        updateCertification({
          id: certificationId,
          certificationData: {
            name: certification.name,
            organization: certification.organization,
            dateObtained: certification.dateObtained,
            expirationDate: certification.expirationDate,
            doesNotExpire: certification.doesNotExpire,
            credentialId: certification.credentialId,
            credentialUrl: certification.credentialUrl,
            isPublic: !certification.isPublic,
          },
        })
      )
        .unwrap()
        .then(() => {
          setSuccessMessage("Visibilité de la certification mise à jour avec succès !");
          dispatch(fetchCertificationsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la mise à jour de la certification:", err);
          setErrorMessage("Erreur lors de la mise à jour de la certification.");
        });
    }
  };

  const handleDeleteCertification = (certificationId: string) => {
    if (userId) {
      dispatch(deleteCertification(certificationId))
        .unwrap()
        .then(() => {
          setSuccessMessage("Certification supprimée avec succès !");
          dispatch(fetchCertificationsByUser(userId));
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la suppression de la certification:", err);
          setErrorMessage("Erreur lors de la suppression de la certification.");
        });
    }
  };

  return (
    <div className="certifications-container">
      <h2>Certifications</h2>
      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {status === "loading" && <p className="loading-text">Chargement des certifications...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {certifications.length > 0 ? (
        <ul className="certifications-list">
          {certifications.map((cert) => (
            <li key={cert.id} className="certification-item">
              <div className="certification-info">
                <strong>{cert.name}</strong> - {cert.organization} ({cert.dateObtained})
                {cert.credentialId && <p>ID: {cert.credentialId}</p>}
                {cert.credentialUrl && (
                  <p>
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                      Voir la certification
                    </a>
                  </p>
                )}
                <label>
                  Public :
                  <input
                    type="checkbox"
                    checked={cert.isPublic || false}
                    onChange={() => handleTogglePublic(cert.id)}
                  />
                </label>
                <button className="edit-button" onClick={() => setSelectedCertification(cert)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteCertification(cert.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-certifications-text">Aucune certification enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddCertification onClose={() => setShowAddForm(false)} />}
      {selectedCertification && <UpdateCertification certification={selectedCertification} onClose={() => setSelectedCertification(null)} />}
    </div>
  );
};

export default Certifications;