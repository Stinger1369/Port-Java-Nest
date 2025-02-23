import { useState, useEffect } from "react"; // Ajout de useEffect pour persistance
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { logout } from "../../redux/features/authSlice";
import { useTranslation } from "react-i18next";
import "./Navbar.css";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user); // Récupère les données de l'utilisateur
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // Persistance de la langue dans localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage) {
      const normalizedLang = savedLanguage.split("-")[0]; // Extrait "fr" de "fr-FR"
      i18n.changeLanguage(normalizedLang);
    }
  }, [i18n]);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsLanguageOpen(false); // Ferme le dropdown langue si ouvert
  };

  const toggleLanguageMenu = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsMenuOpen(false); // Ferme le menu principal si ouvert
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng); // Persiste la langue
    setIsLanguageOpen(false);
  };

  // Normalise la langue pour afficher uniquement le code (ex. : "fr" au lieu de "fr-FR")
  const displayLanguage = i18n.language.split("-")[0].toUpperCase();

  // Vérifie si des données de portfolio existent (par exemple, si educationIds ou autres champs ne sont pas vides)
  const hasPortfolioData = user && (
    user.educationIds?.length > 0 ||
    user.skillIds?.length > 0 ||
    user.experienceIds?.length > 0 ||
    user.projectIds?.length > 0 ||
    user.certificationIds?.length > 0 ||
    user.socialLinkIds?.length > 0 ||
    user.languageIds?.length > 0 ||
    user.recommendationIds?.length > 0 ||
    user.interestIds?.length > 0
  );

  const handlePortfolioClick = () => {
    if (token) {
      if (hasPortfolioData) {
        navigate("/portfolio/global"); // Redirige vers la vue globale si des données existent
      } else {
        navigate("/portfolio"); // Redirige vers la vue par défaut si aucun portfolio n'existe
      }
    } else {
      navigate("/login"); // Redirige vers Login si non connecté
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <i className="fas fa-folder-open"></i> PortfolioCraft
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
        <div className="navbar-language">
          <button className="language-toggle" onClick={toggleLanguageMenu}>
            <i className="fas fa-globe"></i> {displayLanguage}
          </button>
          <div className={`language-dropdown ${isLanguageOpen ? "active" : ""}`}>
            <button onClick={() => changeLanguage("fr")}>FR - Français</button>
            <button onClick={() => changeLanguage("en")}>EN - English</button>
            <button onClick={() => changeLanguage("es")}>ES - Español</button>
            <button onClick={() => changeLanguage("zh")}>ZH - 中文</button>
            <button onClick={() => changeLanguage("ar")}>AR - العربية</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;