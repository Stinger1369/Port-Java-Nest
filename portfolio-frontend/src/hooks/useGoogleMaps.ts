import { useEffect, useState } from "react";

// Charger la clé API depuis les variables d'environnement (Vite uniquement)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si la clé API est définie
    if (!GOOGLE_MAPS_API_KEY) {
      const errorMsg = "Clé API Google Maps manquante dans les variables d'environnement.";
      console.error("❌", errorMsg);
      setError(errorMsg);
      return;
    }

    // Vérifier si l’API est déjà chargée
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("✅ Google Maps et Places API déjà chargés");
      setIsLoaded(true);
      return;
    }

    // Vérifier si le script est déjà présent dans le DOM
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const waitForLoad = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log("✅ Google Maps et Places API chargés après attente");
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
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("✅ Google Maps et Places API chargés avec succès");
        setIsLoaded(true);
        setError(null);
      } else {
        const errorMsg = "Échec de l'initialisation de Google Maps Places API";
        console.error("❌", errorMsg);
        setError(errorMsg);
      }
    };

    script.onerror = (error) => {
      const errorMsg = "Échec du chargement de Google Maps API: " + (error instanceof Error ? error.message : "Erreur inconnue");
      console.error("❌", errorMsg);
      setError(errorMsg);
      setIsLoaded(false);
    };

    document.body.appendChild(script);

    // Nettoyage (optionnel, mais conservé pour éviter les fuites)
    return () => {
      // Ne pas supprimer le script pour éviter de casser d'autres composants
    };
  }, []);

  return { isLoaded, error };
};