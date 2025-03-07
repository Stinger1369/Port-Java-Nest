package com.Portbil.portfolio_backend.service;

import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.model.AddressComponentType;
import com.google.maps.model.GeocodingResult;
import com.google.maps.model.LatLng;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class GoogleMapsService {

    @Value("${google.maps.api-key}")
    private String apiKey;

    /**
     * Récupère l'adresse formatée à partir des coordonnées latitude/longitude via l'API Google Maps
     */
    public String getAddressFromCoordinates(double latitude, double longitude) {
        GeoApiContext context = new GeoApiContext.Builder()
                .apiKey(apiKey)
                .build();

        try {
            GeocodingResult[] results = GeocodingApi.reverseGeocode(context, new LatLng(latitude, longitude))
                    .await();

            if (results != null && results.length > 0) {
                String formattedAddress = results[0].formattedAddress;
                System.out.println("✅ Adresse récupérée via Google Maps : " + formattedAddress);
                return formattedAddress;
            } else {
                throw new RuntimeException("Aucune adresse trouvée pour ces coordonnées.");
            }
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération de l'adresse : " + e.getMessage());
            throw new RuntimeException("Erreur lors de la récupération de l'adresse via Google Maps : " + e.getMessage());
        } finally {
            if (context != null) {
                context.shutdown();
            }
        }
    }

    /**
     * Récupère la ville et le pays à partir des coordonnées latitude/longitude via l'API Google Maps
     */
    public Map<String, String> getCityAndCountryFromCoordinates(double latitude, double longitude) {
        GeoApiContext context = new GeoApiContext.Builder()
                .apiKey(apiKey)
                .build();

        try {
            GeocodingResult[] results = GeocodingApi.reverseGeocode(context, new LatLng(latitude, longitude))
                    .await();

            if (results != null && results.length > 0) {
                String city = null;
                String country = null;

                for (com.google.maps.model.AddressComponent component : results[0].addressComponents) {
                    for (AddressComponentType type : component.types) {
                        if (type == AddressComponentType.LOCALITY || type == AddressComponentType.SUBLOCALITY) {
                            city = component.longName;
                        } else if (type == AddressComponentType.COUNTRY) {
                            country = component.longName;
                        }
                    }
                }

                Map<String, String> locationDetails = new HashMap<>();
                locationDetails.put("city", city != null ? city : "Unknown");
                locationDetails.put("country", country != null ? country : "Unknown");

                System.out.println("✅ Ville et pays récupérés via Google Maps : city=" + city + ", country=" + country);
                return locationDetails;
            } else {
                System.out.println("⚠️ Aucune localisation trouvée, renvoi de valeurs par défaut.");
                Map<String, String> defaultDetails = new HashMap<>();
                defaultDetails.put("city", "Unknown");
                defaultDetails.put("country", "Unknown");
                return defaultDetails;
            }
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération de la ville et du pays : " + e.getMessage());
            Map<String, String> errorDetails = new HashMap<>();
            errorDetails.put("city", "Unknown");
            errorDetails.put("country", "Unknown");
            return errorDetails;
        } finally {
            if (context != null) {
                context.shutdown();
            }
        }
    }
}