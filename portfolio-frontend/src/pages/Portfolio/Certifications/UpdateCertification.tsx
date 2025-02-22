import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateCertification } from "../../../redux/features/certificationSlice";

interface Certification {
  id: string;
  name?: string;
  organization?: string;
  dateObtained?: string;
  expirationDate?: string | null;
  doesNotExpire?: boolean;
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
  });

  useEffect(() => {
    if (certification) {
      setUpdatedCertification({
        id: certification.id,
        name: certification.name || "",
        organization: certification.organization || "",
        dateObtained: certification.dateObtained || "",
        expirationDate: certification.expirationDate || "",
        doesNotExpire: certification.doesNotExpire || false,
      });
    }
  }, [certification]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setUpdatedCertification((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateCertification({ id: updatedCertification.id, certificationData: updatedCertification }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier la Certification</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={updatedCertification.name} onChange={handleChange} required placeholder="Nom de la certification" />
          <input type="text" name="organization" value={updatedCertification.organization} onChange={handleChange} required placeholder="Organisme" />
          <input type="date" name="dateObtained" value={updatedCertification.dateObtained} onChange={handleChange} required />
          {!updatedCertification.doesNotExpire && (
            <input type="date" name="expirationDate" value={updatedCertification.expirationDate || ""} onChange={handleChange} placeholder="Date d'expiration" />
          )}
          <label>
            <input type="checkbox" name="doesNotExpire" checked={updatedCertification.doesNotExpire} onChange={handleChange} />
            Cette certification n'expire pas
          </label>
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateCertification;
