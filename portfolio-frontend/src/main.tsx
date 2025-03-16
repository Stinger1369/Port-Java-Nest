// portfolio-frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";
import Modal from "react-modal"; // Import de react-modal
import "./index.css";
import "./i18n"; // Initialisation de react-i18next
import { library } from "@fortawesome/fontawesome-svg-core"; // Ajout pour configurer FontAwesome
import { faUser, faFlag, faBan, faSmile, faGift, faPaperPlane, faUsers, faUserCircle } from "@fortawesome/free-solid-svg-icons"; // Icônes utilisées
import "react-datepicker/dist/react-datepicker.css"; // Importer ici

// Ajouter les icônes à la bibliothèque FontAwesome
library.add(faUser, faFlag, faBan, faSmile, faGift, faPaperPlane, faUsers, faUserCircle);

// Définir l'élément racine pour react-modal
Modal.setAppElement("#root");

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