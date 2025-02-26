import { useState, useEffect } from "react";

const GOOGLE_MAPS_API_KEY = "AIzaSyDm7CfRG_9wnCW4H0u_pEu8ZtEbkHDLi8o"; // Ta clé API Google Maps
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si l’API est déjà chargée
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Vérifier si le script est déjà présent dans le DOM
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const waitForLoad = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          clearInterval(waitForLoad);
        }
      }, 100);
      return () => clearInterval(waitForLoad);
    }

    // Charger le script dynamiquement
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true; // Assure un chargement non bloquant
    script.onload = () => {
      console.log("✅ Google Maps API loaded successfully");
      setIsLoaded(true);
    };
    script.onerror = () => {
      const errorMsg = "Failed to load Google Maps API";
      console.error(errorMsg);
      setError(errorMsg);
    };

    document.body.appendChild(script);

    // Nettoyage (optionnel, mais conservé pour éviter les fuites)
    return () => {
      // Ne pas supprimer le script pour éviter de casser d'autres composants
      // document.body.removeChild(script);
    };
  }, []);

  return { isLoaded, error };
};