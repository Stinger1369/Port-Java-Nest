package com.Portbil.portfolio_backend.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.lang.Nullable; // Remplacement de javax.annotation.Nullable par org.springframework.lang.Nullable

import java.time.LocalDateTime;

@Document(collection = "contacts")
@Data
@Builder
public class Contact {
    @Id
    private String id;

    @Nullable // Indique que senderId peut être null ou omis
    private String senderId; // Peut être null, omis, ou "anonymous" pour un utilisateur non inscrit
    private String receiverId; // ID de l'utilisateur qui reçoit la demande

    private boolean isAccepted; // Statut de la demande (acceptée ou en attente)
    private LocalDateTime createdAt; // Date de création de la demande
    private LocalDateTime acceptedAt; // Date d'acceptation (si applicable)

    private boolean isDeveloperContact; // Indicateur pour distinguer un contact avec le développeur

    @Nullable
    private String senderEmail; // Nouvel attribut pour l’email du sender (obligatoire pour sender inconnu)
    @Nullable
    private String senderPhone; // Nouvel attribut pour le téléphone du sender (obligatoire pour sender inconnu)
    @Nullable
    private String message; // Nouveau message de contenu (obligatoire pour sender inconnu)

    // Initialisation par défaut de createdAt via le builder
    public static ContactBuilder builder() {
        return new ContactBuilder()
                .createdAt(LocalDateTime.now())
                .isAccepted(false) // Valeur par défaut pour isAccepted
                .isDeveloperContact(false); // Valeur par défaut pour isDeveloperContact
    }
}