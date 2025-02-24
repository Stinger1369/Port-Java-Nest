// portfolio-frontend/src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend) // Charge les traductions via HTTP depuis le backend
  .use(LanguageDetector) // Détecte la langue du navigateur
  .use(initReactI18next) // Intégration avec React
  .init({
    fallbackLng: "fr", // Langue par défaut si la détection échoue ou langue non supportée
    debug: process.env.NODE_ENV === "development", // Logs en développement uniquement
    interpolation: {
      escapeValue: false, // React gère déjà l’échappement
    },
    backend: {
      loadPath: "http://localhost:8080/api/translations/{{lng}}", // URL de votre API Spring Boot
      requestOptions: {
        cache: "default", // Utilise le cache du navigateur
      },
      parse: (data) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error("Failed to parse translation data:", e);
          return {};
        }
      },
      load: (options, url, payload, callback) => {
        fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.json();
          })
          .then((data) => callback(null, { status: "success", data }))
          .catch((err) => callback(err, { status: "error", data: {} }));
      },
    },
    detection: {
      order: ["localStorage", "navigator", "querystring", "cookie", "htmlTag"], // Priorité : localStorage d'abord, puis navigateur
      caches: ["localStorage"], // Persiste la langue dans localStorage
      lookupLocalStorage: "i18nextLng", // Clé utilisée dans localStorage
    },
    supportedLngs: ["fr", "en", "es", "zh", "ar"], // Langues supportées
    load: "languageOnly", // Ignore les variantes régionales (ex. : en-US -> en)
  })
  .then(() => {
    console.log("Langue détectée au démarrage :", i18n.language); // Log pour confirmer la langue initiale
  });

// Ajouter l'écouteur pour gérer la direction du texte
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

export default i18n;