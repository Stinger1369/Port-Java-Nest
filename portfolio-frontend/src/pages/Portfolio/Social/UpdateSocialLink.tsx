import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { updateSocialLink } from "../../../redux/features/socialLinkSlice";

interface Props {
  socialLink: {
    id: string;
    platform: string;
    url: string;
  };
  onClose: () => void;
}

const UpdateSocialLink = ({ socialLink, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [updatedSocialLink, setUpdatedSocialLink] = useState({
    id: socialLink.id,
    platform: socialLink.platform || "",
    url: socialLink.url || "",
  });

  useEffect(() => {
    if (socialLink) {
      setUpdatedSocialLink({
        id: socialLink.id,
        platform: socialLink.platform || "",
        url: socialLink.url || "",
      });
    }
  }, [socialLink]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedSocialLink((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateSocialLink({ id: updatedSocialLink.id, socialLinkData: updatedSocialLink }));
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Modifier un Lien Social</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="platform" value={updatedSocialLink.platform} onChange={handleChange} required />
          <input type="text" name="url" value={updatedSocialLink.url} onChange={handleChange} required />
          <button type="submit">Mettre à jour</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateSocialLink;
