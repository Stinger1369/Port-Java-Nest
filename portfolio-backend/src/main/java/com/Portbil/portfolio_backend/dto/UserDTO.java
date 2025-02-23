package com.Portbil.portfolio_backend.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String sex;
    private String bio;

    // ✅ Nouveaux champs pour la géolocalisation
    private Double latitude;
    private Double longitude;
}