// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialisation de react-i18next
import "@fortawesome/fontawesome-free/css/all.min.css"; // Icônes FontAwesome
import "react-datepicker/dist/react-datepicker.css"; // Importer ici

// Vérifier si la clé API Google Maps est définie (pour le débogage)
if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
  console.log("✅ Clé API Google Maps chargée avec succès:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
} else {
  console.error("❌ Clé API Google Maps manquante dans les variables d'environnement.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);