package com.Portbil.portfolio_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // Ignorer les champs null dans le JSON
public class UserDTO {
    private String id;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String city; // Ajouté pour gérer la ville
    private String country; // Ajouté pour gérer le pays
    private String sex;
    private String slug;
    private String bio;

    // Champs pour la géolocalisation, avec noms alternatifs possibles
    @JsonAlias({ "latitude", "lat" }) // Utilise @JsonAlias pour les noms alternatifs
    private String latitude; // Utilise String directement

    @JsonAlias({ "longitude", "lon" }) // Utilise @JsonAlias pour les noms alternatifs
    private String longitude; // Utilise String directement

    // Getters personnalisés pour convertir les chaînes en Double (si nécessaire pour UserService)
    public Double getLatitudeAsDouble() {
        if (latitude == null) return null;
        try {
            return Double.parseDouble(latitude);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Latitude invalide : " + latitude);
        }
    }

    public Double getLongitudeAsDouble() {
        if (longitude == null) return null;
        try {
            return Double.parseDouble(longitude);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Longitude invalide : " + longitude);
        }
    }
}