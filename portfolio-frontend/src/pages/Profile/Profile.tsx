import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser } from "../../redux/features/userSlice";

const Profile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const status = useSelector((state: RootState) => state.user.status);
  const error = useSelector((state: RootState) => state.user.error);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!user && status === "idle") {
      dispatch(fetchUser());
    }
  }, [token, user, status, navigate, dispatch]);

  if (status === "loading") return <p>Chargement des données...</p>;
  if (status === "failed") return <p style={{ color: "red" }}>Erreur : {error}</p>;

  return (
    <div>
      <h2>Profil</h2>
      {user ? (
        <div>
          <p><strong>Nom :</strong> {user.firstName} {user.lastName}</p>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Téléphone :</strong> {user.phone || "Non renseigné"}</p>
          <p><strong>Adresse :</strong> {user.address || "Non renseignée"}</p>
          <p><strong>Ville :</strong> {user.city || "Non renseignée"}</p>
          <p><strong>Pays :</strong> {user.country || "Non renseigné"}</p>
          <p><strong>Genre :</strong> {user.gender || "Non spécifié"}</p>
          <p><strong>Biographie :</strong> {user.bio || "Pas de biographie"}</p>

          <button onClick={() => navigate("/edit-profile")}>Modifier mon profil</button>
        </div>
      ) : (
        <p>Utilisateur non trouvé.</p>
      )}
    </div>
  );
};

export default Profile;
