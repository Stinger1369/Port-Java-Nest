import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { fetchWeather, updateGeolocation } from "../../redux/features/userSlice";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./WeatherComponent.css";

const WeatherComponent = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const weather = useSelector((state: RootState) => state.user.weather);
  const status = useSelector((state: RootState) => state.user.status);
  const token = useSelector((state: RootState) => state.auth.token);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!token || !user?.id) {
      console.log("🔹 En attente de connexion de l'utilisateur et du token...");
      return;
    }

    console.log("🔹 Démarrage de la surveillance automatique pour l'utilisateur:", user.id);
    console.log("🔹 Coordonnées actuelles dans Redux:", {
      latitude: user.latitude,
      longitude: user.longitude,
    });

    let watchId: number | undefined;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("🔹 Nouvelle position détectée par watchPosition:", { latitude, longitude });

          if (user.latitude !== latitude || user.longitude !== longitude) {
            console.log("✅ Changement de géolocalisation détecté via watchPosition ! Mise à jour...");
            dispatch(updateGeolocation({ userId: user.id, latitude, longitude })).then(() => {
              dispatch(fetchWeather(user.id));
            });
          } else {
            console.log("ℹ️ Aucune différence détectée avec les coordonnées actuelles.");
          }
        },
        (err) => {
          console.error("Erreur de géolocalisation automatique:", err.message);
          fetchLocationFromIP();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn("❌ Géolocalisation non supportée. Tentative via IP...");
      fetchLocationFromIP();
    }

    const fetchLocationFromIP = async () => {
      try {
        const response = await axios.get("https://ipapi.co/json/");
        const { latitude, longitude } = response.data;
        console.log("🔹 Position détectée via IP:", { latitude, longitude });

        if (user.latitude !== latitude || user.longitude !== longitude) {
          console.log("✅ Changement de géolocalisation détecté via IP ! Mise à jour...");
          dispatch(updateGeolocation({ userId: user.id, latitude, longitude })).then(() => {
            dispatch(fetchWeather(user.id));
          });
        } else {
          console.log("ℹ️ Aucune différence détectée via IP.");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la récupération de la localisation via IP:", error);
      }
    };

    fetchLocationFromIP();

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
        console.log("🛑 Surveillance de la géolocalisation arrêtée");
      }
    };
  }, [dispatch, user?.id, token]);

  useEffect(() => {
    if (token && user?.id && user.latitude && user.longitude && !weather) {
      console.log("🔹 Récupération initiale de la météo pour:", user.id);
      dispatch(fetchWeather(user.id));
    }
  }, [token, user, weather, dispatch]);

  const toggleWeatherMenu = () => {
    setIsWeatherOpen(!isWeatherOpen);
  };

  const handleManualUpdateGeolocation = () => {
    if (!navigator.geolocation) {
      console.warn("❌ Géolocalisation non supportée pour la mise à jour manuelle.");
      return;
    }
    if (!user?.id) {
      console.warn("❌ Aucun utilisateur connecté pour la mise à jour manuelle.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("🔹 Mise à jour manuelle - Nouvelle position :", { latitude, longitude });
        dispatch(updateGeolocation({ userId: user.id, latitude, longitude })).then(() => {
          dispatch(fetchWeather(user.id));
        });
      },
      (err) => {
        console.error("Erreur de géolocalisation manuelle:", err.message);
      }
    );
  };

  const getWeatherIconClass = (description: string = "") => {
    const desc = description.toLowerCase();
    if (desc.includes("clear") || desc.includes("sun")) return "fas fa-sun sunny";
    if (desc.includes("cloud")) return "fas fa-cloud cloudy";
    if (desc.includes("rain") || desc.includes("shower")) return "fas fa-cloud-showers-heavy rain";
    if (desc.includes("thunder") || desc.includes("storm")) return "fas fa-bolt storm";
    if (desc.includes("snow")) return "fas fa-snowflake snow";
    return "fas fa-question";
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    user && (
      <div className="weather-container">
        <button className="weather-toggle" onClick={toggleWeatherMenu}>
          <i className={weather ? getWeatherIconClass(weather.description) : "fas fa-cloud"}></i>{" "}
          {weather ? `${weather.city}, ${Math.round(weather.temperature)}°C` : t("navbar.weather")}
        </button>
        <div className={`weather-panel ${isWeatherOpen ? "active" : ""} ${isRTL ? "rtl" : ""}`}>
          <div className="weather-header">
            <h3>{t("weather.title")}</h3>
            <button
              className="refresh-btn"
              onClick={handleManualUpdateGeolocation}
              disabled={status === "loading"}
            >
              <i className="fas fa-sync-alt"></i> {t("weather.refresh")}
            </button>
          </div>
          {weather ? (
            <ul className="weather-details">
              <div className="weather-section">
                <h4>{t("weather.currentConditions")}</h4>
                <li>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{t("weather.city")}: {weather.city}</span>
                </li>
                <li>
                  <i className="fas fa-thermometer-half"></i>
                  <span>{t("weather.temperature")}: {weather.temperature}°C</span>
                </li>
                <li>
                  <i className="fas fa-temperature-high"></i>
                  <span>{t("weather.feelsLike")}: {weather.feelsLike}°C</span>
                </li>
                <li>
                  <i className={getWeatherIconClass(weather.description)}></i>
                  <span>{t("weather.condition")}: {weather.description}</span>
                </li>
                <li>
                  <i className="fas fa-tint"></i>
                  <span>{t("weather.humidity")}: {weather.humidity}%</span>
                </li>
                <li>
                  <i className="fas fa-tachometer-alt"></i>
                  <span>{t("weather.pressure")}: {weather.pressure} hPa</span>
                </li>
              </div>
              <div className="weather-section">
                <h4>{t("weather.wind")}</h4>
                <li>
                  <i className="fas fa-wind"></i>
                  <span>{t("weather.windSpeed")}: {weather.windSpeed} km/h</span>
                </li>
                <li>
                  <i className="fas fa-compass"></i>
                  <span>{t("weather.windDirection")}: {weather.windDirection}°</span>
                </li>
              </div>
              <div className="weather-section">
                <h4>{t("weather.visibility")}</h4>
                <li>
                  <i className="fas fa-eye"></i>
                  <span>{t("weather.distance")}: {weather.visibility / 1000} km</span>
                </li>
              </div>
              <div className="weather-section">
                <h4>{t("weather.sun")}</h4>
                <li>
                  <i className="fas fa-sun"></i>
                  <span>{t("weather.sunrise")}: {formatTime(weather.sunrise)}</span>
                </li>
                <li>
                  <i className="fas fa-moon"></i>
                  <span>{t("weather.sunset")}: {formatTime(weather.sunset)}</span>
                </li>
                <li>
                  <i className="fas fa-umbrella-beach"></i>
                  <span>{t("weather.uvIndex")}: {weather.uvIndex}</span>
                </li>
              </div>
            </ul>
          ) : (
            <p className="no-data">{t("weather.noData")}</p>
          )}
        </div>
      </div>
    )
  );
};

export default WeatherComponent;