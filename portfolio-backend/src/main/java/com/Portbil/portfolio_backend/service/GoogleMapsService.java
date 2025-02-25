package com.Portbil.portfolio_backend.service;

import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.model.GeocodingResult;
import com.google.maps.model.LatLng;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
            context.shutdown();
        }
    }
}