// portfolio-frontend/src/axiosConfig.ts
import axios from "axios";
import i18n from "./i18n";

axios.interceptors.request.use((config) => {
  const lang = i18n.language || "fr"; // Utilise la langue actuelle ou "fr" par défaut
  config.headers["Accept-Language"] = lang;
  config.headers["Content-Type"] = "application/json; charset=UTF-8"; // Assure l’encodage UTF-8
  console.log("🔹 Intercepteur axios - Langue envoyée :", lang); // Log pour debug
  return config;
});

export default axios;