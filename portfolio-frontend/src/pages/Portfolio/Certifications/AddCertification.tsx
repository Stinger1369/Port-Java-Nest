import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addCertification } from "../../../redux/features/certificationSlice";

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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCertification((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    // Si la certification n'expire pas, on ignore expirationDate
    const certificationData = certification.doesNotExpire
      ? { ...certification, expirationDate: null }
      : certification;

    dispatch(addCertification({ ...certificationData, userId }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter une Certification</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={certification.name} onChange={handleChange} placeholder="Nom de la certification" required />
          <input type="text" name="organization" value={certification.organization} onChange={handleChange} placeholder="Organisme" required />
          <input type="date" name="dateObtained" value={certification.dateObtained} onChange={handleChange} required />
          {!certification.doesNotExpire && (
            <input type="date" name="expirationDate" value={certification.expirationDate} onChange={handleChange} placeholder="Date d'expiration" />
          )}
          <label>
            <input type="checkbox" name="doesNotExpire" checked={certification.doesNotExpire} onChange={handleChange} />
            Cette certification n'expire pas
          </label>
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddCertification;
