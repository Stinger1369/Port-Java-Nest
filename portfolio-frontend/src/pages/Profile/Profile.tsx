import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchUser } from "../../redux/features/userSlice";
import "./Profile.css"; // ✅ Import du CSS spécifique

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

  if (status === "loading") return <div className="profile-loading">Chargement des données...</div>;
  if (status === "failed") return <div className="profile-error">Erreur : {error}</div>;

  const getSexLabel = (sex: string | undefined) => {
    switch (sex) {
      case "Man":
        return "Homme";
      case "Woman":
        return "Femme";
      case "Other":
        return "Autre";
      default:
        return "Non spécifié";
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">Mon Profil</h2>
      {user ? (
        <div className="profile-card">
          <ul className="profile-details">
            <li>
              <i className="fas fa-user"></i>
              <span><strong>Nom :</strong> {user.firstName} {user.lastName}</span>
            </li>
            <li>
              <i className="fas fa-envelope"></i>
              <span><strong>Email :</strong> {user.email}</span>
            </li>
            <li>
              <i className="fas fa-phone"></i>
              <span><strong>Téléphone :</strong> {user.phone || "Non renseigné"}</span>
            </li>
            <li>
              <i className="fas fa-map-marker-alt"></i>
              <span><strong>Adresse :</strong> {user.address || "Non renseignée"}</span>
            </li>
            <li>
              <i className="fas fa-city"></i>
              <span><strong>Ville :</strong> {user.city || "Non renseignée"}</span>
            </li>
            <li>
              <i className="fas fa-globe"></i>
              <span><strong>Pays :</strong> {user.country || "Non renseigné"}</span>
            </li>
            <li>
              <i className="fas fa-venus-mars"></i>
              <span><strong>Sexe :</strong> {getSexLabel(user.sex)}</span>
            </li>
            <li>
              <i className="fas fa-book"></i>
              <span><strong>Biographie :</strong> {user.bio || "Pas de biographie"}</span>
            </li>
          </ul>
          <button className="profile-edit-btn" onClick={() => navigate("/edit-profile")}>
            <i className="fas fa-edit"></i> Modifier mon profil
          </button>
        </div>
      ) : (
        <p className="profile-empty">Utilisateur non trouvé.</p>
      )}
    </div>
  );
};

export default Profile;