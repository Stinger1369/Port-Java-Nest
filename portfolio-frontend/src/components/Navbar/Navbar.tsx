import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { logout } from "../../redux/features/authSlice";
import { fetchWeather, updateGeolocation } from "../../redux/features/userSlice"; // ✅ Ajout de updateGeolocation
import { useTranslation } from "react-i18next";
import "./Navbar.css";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.user.user);
  const weather = useSelector((state: RootState) => state.user.weather);
  const status = useSelector((state: RootState) => state.user.status);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false); // ✅ État pour le dropdown météo

  // Persistance de la langue dans localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage) {
      const normalizedLang = savedLanguage.split("-")[0];
      i18n.changeLanguage(normalizedLang);
    }
  }, [i18n]);

  // Charger la météo si l'utilisateur est connecté et a des coordonnées
  useEffect(() => {
    if (token && user?.id && user.latitude && user.longitude && !weather) {
      dispatch(fetchWeather(user.id));
    }
  }, [token, user, weather, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsLanguageOpen(false);
    setIsWeatherOpen(false);
  };

  const toggleLanguageMenu = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsMenuOpen(false);
    setIsWeatherOpen(false);
  };

  const toggleWeatherMenu = () => {
    setIsWeatherOpen(!isWeatherOpen);
    setIsMenuOpen(false);
    setIsLanguageOpen(false);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setIsLanguageOpen(false);
  };

  // Mettre à jour la géolocalisation
  const handleUpdateGeolocation = () => {
    if (navigator.geolocation && user?.id) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(updateGeolocation({ userId: user.id, latitude, longitude }));
        },
        (err) => {
          console.error("Erreur de géolocalisation:", err.message);
        }
      );
    } else {
      console.warn("Géolocalisation non supportée ou utilisateur non connecté");
    }
  };

  const displayLanguage = i18n.language.split("-")[0].toUpperCase();

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

  // Logique pour déterminer l'icône météo
  const getWeatherIconClass = (description: string = "") => {
    const desc = description.toLowerCase();
    if (desc.includes("clear") || desc.includes("sun")) return "fas fa-sun sunny";
    if (desc.includes("cloud")) return "fas fa-cloud cloudy";
    if (desc.includes("rain") || desc.includes("shower")) return "fas fa-cloud-showers-heavy rain";
    if (desc.includes("thunder") || desc.includes("storm")) return "fas fa-bolt storm";
    if (desc.includes("snow")) return "fas fa-snowflake snow";
    return "fas fa-question";
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
            {/* ✅ Section météo complète dans la navbar */}
            {user && (
              <div className="navbar-weather">
                <button className="weather-toggle" onClick={toggleWeatherMenu}>
                  <i className={weather ? getWeatherIconClass(weather.description) : "fas fa-cloud"}></i>{" "}
                  {weather ? `${Math.round(weather.temperature)}°C` : t("navbar.weather", "Weather")}
                </button>
                <div className={`weather-dropdown ${isWeatherOpen ? "active" : ""}`}>
                  <h3>{t("profile.weather", "Current Weather")}</h3>
                  <button
                    className="update-location-btn"
                    onClick={handleUpdateGeolocation}
                    disabled={status === "loading"}
                  >
                    <i className="fas fa-location-arrow"></i> {t("profile.updateLocation", "Update Location")}
                  </button>
                  {weather ? (
                    <ul className="weather-details">
                      <li>
                        <span className="label">{t("profile.weatherTemp", "Temperature")} :</span>{" "}
                        {weather.temperature}°C
                      </li>
                      <li>
                        <span className="label">{t("profile.weatherDesc", "Description")} :</span>{" "}
                        {weather.description}
                      </li>
                      <li>
                        <span className="label">{t("profile.weatherHumidity", "Humidity")} :</span>{" "}
                        {weather.humidity}%
                      </li>
                    </ul>
                  ) : (
                    <p>{t("profile.noWeather", "No weather data available. Update your location.")}</p>
                  )}
                </div>
              </div>
            )}
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