package com.Portbil.portfolio_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    private List<String> likedUserIds;
    private List<String> likerUserIds;
    private List<String> imageIds;
    private List<String> friendIds;
    private List<String> friendRequestSentIds;
    private List<String> friendRequestReceivedIds;

    // Nouveaux champs pour blocage et signalement
    private List<String> blockedUserIds; // Utilisateurs bloqués
    private List<String> reportedByUserIds; // Utilisateurs ayant signalé

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate birthdate;

    private boolean showBirthdate;
    private Integer age;
    private String slug;
    private String bio;
    private String profilePictureUrl;

    @JsonAlias({"latitude", "lat"})
    private String latitude;

    @JsonAlias({"longitude", "lon"})
    private String longitude;

    private List<String> chatIds;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastVerificationCodeRequest;
    private int verificationCodeRequestCount;

    private boolean isVerified;
    private String chatTheme;

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