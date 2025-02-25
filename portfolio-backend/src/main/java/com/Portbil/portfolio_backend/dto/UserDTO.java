package com.Portbil.portfolio_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
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
    private String slug;
    private String bio;

    // Champs pour la géolocalisation
    private Double latitude;
    private Double longitude;
}