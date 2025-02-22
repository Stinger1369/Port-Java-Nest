import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateInterest } from "../../../redux/features/interestSlice";

interface Props {
  interest: {
    id: string;
    name?: string;
  };
  onClose: () => void;
}

const UpdateInterest = ({ interest, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedInterest, setUpdatedInterest] = useState({
    id: interest.id,
    name: interest.name || "",
  });

  useEffect(() => {
    if (interest) {
      setUpdatedInterest({
        id: interest.id,
        name: interest.name || "",
      });
    }
  }, [interest]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedInterest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateInterest({ id: updatedInterest.id, interestData: updatedInterest }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier le Centre d’Intérêt</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={updatedInterest.name} onChange={handleChange} required />
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateInterest;
