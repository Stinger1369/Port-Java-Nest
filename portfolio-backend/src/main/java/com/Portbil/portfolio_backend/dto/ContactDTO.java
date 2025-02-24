package com.Portbil.portfolio_backend.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.lang.Nullable; // Remplacement de javax.annotation.Nullable par org.springframework.lang.Nullable

@Data
@Builder
public class ContactDTO {
    private String id;
    @Nullable // Indique que senderId peut être null ou omis
    private String senderId; // Peut être null, omis, ou "anonymous" pour un utilisateur non inscrit
    private String receiverId;
    private boolean isAccepted;
    @Nullable
    private String senderEmail; // Nouvel attribut pour l’email du sender (obligatoire pour sender inconnu)
    @Nullable
    private String senderPhone; // Nouvel attribut pour le téléphone du sender (obligatoire pour sender inconnu)
    @Nullable
    private String message; // Nouveau message de contenu (obligatoire pour sender inconnu)
    private String senderName; // Nom de l'envoyeur (optionnel, peut être "Anonymous" pour non inscrit)
    private String receiverName; // Nom du destinataire (optionnel)
    private boolean isDeveloperContact; // Indique si c’est un contact avec le développeur
}