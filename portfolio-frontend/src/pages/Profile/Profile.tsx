import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Profile = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div>
      <h2>Profil</h2>
      <p>Bienvenue dans votre espace personnel.</p>
      <button onClick={() => navigate("/edit-profile")}>Modifier mon profil</button>
    </div>
  );
};

export default Profile;
