import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchCertificationsByUser, deleteCertification } from "../../../redux/features/certificationSlice";
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

  useEffect(() => {
    if (userId) {
      dispatch(fetchCertificationsByUser(userId));
    }
  }, [dispatch, userId]);

  return (
    <div className="certifications-container">
      <h2>Certifications et Formations</h2>

      {status === "loading" && <p className="loading-text">Chargement des certifications...</p>}
      {status === "failed" && <p className="error-text">Erreur : {error}</p>}

      {certifications.length > 0 ? (
        <ul className="certifications-list">
          {certifications.map((cert) => (
            <li key={cert.id} className="certification-item">
              <div className="certification-info">
                <strong>{cert.name}</strong> - {cert.organization}
                <p>Date d'obtention : {cert.dateObtained}</p>
                {cert.expirationDate ? (
                  <p>Date d'expiration : {cert.expirationDate}</p>
                ) : cert.doesNotExpire ? (
                  <p className="no-expiry">✅ Cette certification n'expire pas</p>
                ) : null}

                {cert.credentialUrl && (
                  <p>
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                      🔗 Voir la certification
                    </a>
                  </p>
                )}

                <button className="edit-button" onClick={() => setSelectedCertification(cert)}>✏️ Modifier</button>
                <button className="delete-button" onClick={() => dispatch(deleteCertification(cert.id))}>🗑️ Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-certification-text">Aucune certification enregistrée.</p>
      )}

      <button className="add-button" onClick={() => setShowAddForm(true)}>➕ Ajouter</button>

      {showAddForm && <AddCertification onClose={() => setShowAddForm(false)} />}
      {selectedCertification && <UpdateCertification certification={selectedCertification} onClose={() => setSelectedCertification(null)} />}
    </div>
  );
};

export default Certifications;
