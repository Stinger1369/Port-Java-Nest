package com.Portbil.portfolio_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendRequestDTO {
    private String id; // ID de l'utilisateur qui a envoyé la demande
    private String firstName; // Prénom de l'utilisateur
    private String lastName; // Nom de l'utilisateur
    private String email; // Email de l'utilisateur
    private String profilePictureUrl; // URL de la photo de profil
}