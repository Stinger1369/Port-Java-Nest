import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser, updateUser } from "../../../redux/features/userSlice";

const EditProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);
  const message = useSelector((state: RootState) => state.user.message);

  // ✅ Récupérer l'ID utilisateur depuis localStorage
  const userId = localStorage.getItem("userId");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    sex: "", // ✅ Ajout du champ sex
    bio: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!user && userId) {
      dispatch(fetchUser()); // ✅ Récupération correcte de l'utilisateur
    } else if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        sex: user.sex || "", // ✅ Ajout de la récupération de sex
        bio: user.bio || "",
      });
    }
  }, [token, user, userId, dispatch, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      dispatch(updateUser({ id: user.id, ...formData }));
    }
  };

  return (
    <div className="edit-profile-container">
      <h2>Modifier le Profil</h2>

      {status === "loading" && <p>Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form onSubmit={handleSubmit}>
        <label>Prénom :</label>
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />

        <label>Nom :</label>
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />

        <label>Téléphone :</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />

        <label>Adresse :</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} />

        <label>Ville :</label>
        <input type="text" name="city" value={formData.city} onChange={handleChange} />

        <label>Pays :</label>
        <input type="text" name="country" value={formData.country} onChange={handleChange} />

        <label>Sexe :</label>
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="">Ne pas préciser</option>
          <option value="Man">Homme</option>
          <option value="Woman">Femme</option>
          <option value="Other">Autre</option>
        </select>

        <label>Bio :</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} />

        <button type="submit">Enregistrer</button>
      </form>

      <button onClick={() => navigate("/profile")}>Retour au profil</button>
    </div>
  );
};

export default EditProfile;
