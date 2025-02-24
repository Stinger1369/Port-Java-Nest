import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { logout } from "../../redux/features/authSlice";
import { fetchUser } from "../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import WeatherComponent from "../WeatherComponent/WeatherComponent";
import UserDropdown from "../UserDropdown/UserDropdown";
import "./Navbar.css";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const isArabic = i18n.language === "ar";

  const dropdownRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUser());
    }
  }, [dispatch, token, user]);

  // Gestion des clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (weatherRef.current && !weatherRef.current.contains(event.target as Node)) {
        setIsWeatherOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    <nav className={`navbar ${isArabic ? "arabic" : ""}`}>
      <Link to="/" className="navbar-logo">
        <i className="fas fa-folder-open"></i> Portfolio
      </Link>
      <button className="navbar-toggle" onClick={toggleMenu}>
        <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>
      <div className={`navbar-links ${isMenuOpen ? "active" : ""}`}>
        {token ? (
          <>
            <button onClick={handlePortfolioClick} className="nav-item">
              <i className="fas fa-briefcase"></i> {t("navbar.portfolio")}
            </button>
            <WeatherComponent
              ref={weatherRef}
              isOpen={isWeatherOpen}
              onToggle={() => setIsWeatherOpen(!isWeatherOpen)}
              onClose={() => setIsWeatherOpen(false)}
            />
            <button onClick={handleLogout} className="nav-item">
              <i className="fas fa-sign-out-alt"></i> {t("navbar.logout")}
            </button>
            <UserDropdown
              ref={dropdownRef}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onClose={() => setIsDropdownOpen(false)}
            />
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
        <LanguageSelector
          ref={languageRef}
          isOpen={isLanguageOpen}
          onToggle={() => setIsLanguageOpen(!isLanguageOpen)}
          onClose={() => setIsLanguageOpen(false)}
        />
      </div>
    </nav>
  );
};

export default Navbar;