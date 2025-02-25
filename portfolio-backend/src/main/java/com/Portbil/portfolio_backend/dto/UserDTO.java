package com.Portbil.portfolio_backend.dto;

import lombok.Builder; // ✅ Ajout de l'import pour Builder
import lombok.Data;

@Data
@Builder // ✅ Ajout de l'annotation Builder
public class UserDTO {
    private String id; // ✅ Ajouté pour correspondre à l'entité User
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String sex;
    private String slug;
    private String bio;

    // ✅ Nouveaux champs pour la géolocalisation
    private Double latitude;
    private Double longitude;
}