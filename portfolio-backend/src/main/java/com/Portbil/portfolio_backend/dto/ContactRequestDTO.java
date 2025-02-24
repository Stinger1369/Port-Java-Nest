package com.Portbil.portfolio_backend.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;
@Data
public class ContactRequestDTO {
    private String senderId; // Peut être null pour un anonyme
    @NotNull(message = "receiverId est requis")
    private String receiverId;
    private String senderEmail; // Obligatoire pour un anonyme
    private String senderPhone; // Obligatoire pour un anonyme
    private String message; // Obligatoire pour un anonyme
    private boolean isDeveloperContact = false; // Par défaut à false
}