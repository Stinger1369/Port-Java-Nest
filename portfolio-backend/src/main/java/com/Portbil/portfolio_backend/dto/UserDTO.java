package com.Portbil.portfolio_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDTO {
    private String id;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String sex;

    // Champs pour les "likes"
    private List<String> likedUserIds;
    private List<String> likerUserIds;

    // Champ pour les images
    private List<String> imageIds;

    // Nouveaux champs pour les amis
    private List<String> friendIds; // Liste des amis acceptés
    private List<String> friendRequestSentIds; // Demandes d'amis envoyées
    private List<String> friendRequestReceivedIds; // Demandes d'amis reçues

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate birthdate;

    private boolean showBirthdate;
    private Integer age;
    private String slug;
    private String bio;

    @JsonAlias({"latitude", "lat"})
    private String latitude;

    @JsonAlias({"longitude", "lon"})
    private String longitude;

    // Champ pour les conversations
    private List<String> chatIds;

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