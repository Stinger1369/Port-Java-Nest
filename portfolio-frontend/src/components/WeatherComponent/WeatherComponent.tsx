import React, { useState, useEffect, forwardRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { fetchWeather } from "../../redux/features/weatherSlice";
import { updateGeolocation } from "../../redux/features/googleMapsSlice";
import { useTranslation } from "react-i18next";
import "./WeatherComponent.css";

interface WeatherComponentProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const WeatherComponent = forwardRef<HTMLDivElement, WeatherComponentProps>((props, ref) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const { weather, status, error } = useSelector((state: RootState) => state.weather);
  const { latitude, longitude } = useSelector((state: RootState) => state.googleMaps);
  const token = useSelector((state: RootState) => state.auth.token);
  const isRTL = i18n.language === "ar";
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  useEffect(() => {
    if (!token || !user?.id) return;

    let watchId: number | undefined;

    const fetchGeoAndWeather = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude: newLatitude, longitude: newLongitude } = position.coords;
            if (latitude !== newLatitude || longitude !== newLongitude) {
              dispatch(updateGeolocation({ userId: user.id, latitude: newLatitude, longitude: newLongitude })).then(() => {
                dispatch(fetchWeather(user.id));
              });
            } else if (!weather) {
              dispatch(fetchWeather(user.id));
            }
          },
          (err) => {
            setGeoError(t("weather.geoError", { message: err.message }));
            console.error("Erreur de géolocalisation automatique:", err.message);
            if (!weather) {
              dispatch(fetchWeather(user.id));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      } else {
        setGeoError(t("weather.geoNotSupported", "Geolocation is not supported by this browser."));
        if (!weather) {
          dispatch(fetchWeather(user.id));
        }
      }
    };

    fetchGeoAndWeather();

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [dispatch, user?.id, token, latitude, longitude, weather, t]);

  const handleManualUpdateGeolocation = () => {
    if (!navigator.geolocation || !user?.id) {
      setGeoError(t("weather.geoNotSupported", "Geolocation is not supported by this browser."));
      if (!weather) {
        dispatch(fetchWeather(user.id));
      }
      return;
    }

    setIsGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: newLatitude, longitude: newLongitude } = position.coords;
        dispatch(updateGeolocation({ userId: user.id, latitude: newLatitude, longitude: newLongitude }))
          .unwrap()
          .then(() => {
            dispatch(fetchWeather(user.id));
          })
          .catch((err) => {
            setGeoError(t("weather.geoErrorManual", { message: err }));
            dispatch(fetchWeather(user.id));
          })
          .finally(() => {
            setIsGeoLoading(false);
          });
      },
      (err) => {
        setGeoError(t("weather.geoErrorManual", { message: err.message }));
        console.error("Erreur de géolocalisation manuelle:", err.message);
        dispatch(fetchWeather(user.id));
        setIsGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
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
      <div className={`weather-container ${isRTL ? "arabic" : ""}`} ref={ref}>
        <button className="weather-toggle" onClick={props.onToggle}>
          <i className={weather ? getWeatherIconClass(weather.description) : "fas fa-cloud"}></i>{" "}
          {weather ? `${weather.city}, ${Math.round(weather.temperature)}°C` : t("weather.city")}
        </button>
        <div className={`weather-panel ${props.isOpen ? "active" : ""} ${isRTL ? "arabic" : ""}`}>
          <div className="weather-header">
            <h3>{t("weather.title")}</h3>
            <button
              className="refresh-btn"
              onClick={handleManualUpdateGeolocation}
              disabled={status === "loading" || isGeoLoading}
            >
              <i className={`fas fa-sync-alt ${isGeoLoading ? "fa-spin" : ""}`}></i>{" "}
              {isGeoLoading ? t("weather.refreshing") : t("weather.refresh")}
            </button>
          </div>
          {status === "loading" && !geoError && <p>{t("weather.loading")}</p>}
          {error || geoError ? (
            <p className="error">{error || geoError}</p>
          ) : weather ? (
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
});

export default WeatherComponent;