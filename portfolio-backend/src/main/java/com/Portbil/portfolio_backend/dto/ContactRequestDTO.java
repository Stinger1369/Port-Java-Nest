package com.Portbil.portfolio_backend.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class ContactRequestDTO {
    private String senderId; // Peut être null pour un anonyme
    @NotBlank(message = "receiverId est requis")
    private String receiverId;
    private String senderEmail; // Obligatoire pour un anonyme
    private String senderPhone; // Obligatoire pour un anonyme
    private String message; // Obligatoire pour un anonyme
    @NotBlank(message = "firstName est requis")
    private String firstName; // ✅ Nouveau champ obligatoire
    @NotBlank(message = "lastName est requis")
    private String lastName; // ✅ Nouveau champ obligatoire
    private String company; // ✅ Nouveau champ facultatif
    private boolean isDeveloperContact = false; // Par défaut à false
}