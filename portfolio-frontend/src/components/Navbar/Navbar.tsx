import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { logout } from "../../redux/features/authSlice";
import { useTranslation } from "react-i18next";
import "./Navbar.css";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng); // Change la langue globalement et persiste dans localStorage
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        {t("navbar.logo")}
      </Link>
      <div className="navbar-right">
        <button className="hamburger" onClick={toggleMenu}>
          {isMenuOpen ? "✕" : "☰"}
        </button>
        <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          {token ? (
            <>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                {t("navbar.profile")}
              </Link>
              <Link to="/portfolio" onClick={() => setIsMenuOpen(false)}>
                {t("navbar.portfolio")}
              </Link>
              <button onClick={handleLogout}>{t("navbar.logout")}</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                {t("navbar.login")}
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                {t("navbar.register")}
              </Link>
            </>
          )}
          <select
            className="language-select"
            value={i18n.language} // Reflète la langue détectée ou choisie
            onChange={(e) => changeLanguage(e.target.value)}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="zh">中文 (Chinese)</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;