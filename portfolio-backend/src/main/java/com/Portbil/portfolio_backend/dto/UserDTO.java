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

    // ✅ Ajout du champ `sex`
    private String sex;

    private String bio;
}
