package com.Portbil.portfolio_backend.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String email;      // ✅ Ajout du champ email
    private String password;   // ✅ Ajout du champ password

    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String gender;
    private String bio;
}
