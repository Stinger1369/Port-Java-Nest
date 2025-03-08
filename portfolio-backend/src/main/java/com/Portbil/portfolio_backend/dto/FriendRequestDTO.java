package com.Portbil.portfolio_backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRequestDTO {
    private String id; // ID de la demande d'ami
    private String senderId; // ID de l'utilisateur qui a envoyé la demande
    private String receiverId; // ID de l'utilisateur qui reçoit la demande
    private String firstName; // Prénom de l'utilisateur (facultatif, pour affichage)
    private String lastName; // Nom de l'utilisateur (facultatif, pour affichage)
    private String email; // Email de l'utilisateur (facultatif, pour affichage)
    private String profilePictureUrl; // URL de la photo de profil (facultatif, pour affichage)
    private String status; // Statut de la demande (PENDING, ACCEPTED, REJECTED, CANCELED)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt; // Date de création
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt; // Date de dernière mise à jour
}