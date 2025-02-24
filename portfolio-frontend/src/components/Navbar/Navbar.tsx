import { useState, useEffect } from "react"; // Ajoute useEffect
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { logout } from "../../redux/features/authSlice";
import { fetchUser } from "../../redux/features/userSlice"; // Ajoute fetchUser
import { useTranslation } from "react-i18next";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import WeatherComponent from "../WeatherComponent/WeatherComponent";
import "./Navbar.css";

const Navbar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Charge l'utilisateur dès que le token est disponible
  useEffect(() => {
    if (token && !user) {
      console.log("🔹 Chargement initial de l'utilisateur avec le token:", token);
      dispatch(fetchUser());
    }
  }, [dispatch, token, user]);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const hasPortfolioData =
    user &&
    (user.educationIds?.length > 0 ||
      user.skillIds?.length > 0 ||
      user.experienceIds?.length > 0 ||
      user.projectIds?.length > 0 ||
      user.certificationIds?.length > 0 ||
      user.socialLinkIds?.length > 0 ||
      user.languageIds?.length > 0 ||
      user.recommendationIds?.length > 0 ||
      user.interestIds?.length > 0);

  const handlePortfolioClick = () => {
    if (token) {
      if (hasPortfolioData) {
        navigate("/portfolio/global");
      } else {
        navigate("/portfolio");
      }
    } else {
      navigate("/login");
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <i className="fas fa-folder-open"></i> Portfolio
      </Link>
      <button className="navbar-toggle" onClick={toggleMenu}>
        <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>
      <div className={`navbar-links ${isMenuOpen ? "active" : ""}`}>
        {token ? (
          <>
            <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="nav-item">
              <i className="fas fa-user"></i> {t("navbar.profile")}
            </Link>
            <button onClick={handlePortfolioClick} className="nav-item">
              <i className="fas fa-briefcase"></i> {t("navbar.portfolio")}
            </button>
            <WeatherComponent />
            <button onClick={handleLogout} className="nav-item">
              <i className="fas fa-sign-out-alt"></i> {t("navbar.logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="nav-item">
              <i className="fas fa-sign-in-alt"></i> {t("navbar.login")}
            </Link>
            <Link to="/register" onClick={() => setIsMenuOpen(false)} className="nav-item">
              <i className="fas fa-user-plus"></i> {t("navbar.register")}
            </Link>
          </>
        )}
        <LanguageSelector />
      </div>
    </nav>
  );
};

export default Navbar;