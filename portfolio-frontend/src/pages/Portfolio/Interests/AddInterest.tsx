import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { addInterest } from "../../../redux/features/interestSlice";

interface Props {
  onClose: () => void;
}

const AddInterest = ({ onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [interest, setInterest] = useState({
    name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInterest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ Erreur : ID utilisateur manquant.");
      return;
    }

    dispatch(addInterest({ ...interest, userId }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Ajouter un Centre d’Intérêt</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={interest.name} onChange={handleChange} placeholder="Nom du centre d’intérêt" required />
          <button type="submit">Ajouter</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default AddInterest;
