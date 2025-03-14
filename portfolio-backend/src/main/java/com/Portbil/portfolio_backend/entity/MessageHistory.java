package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "message_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageHistory {

    @Id
    private String id;

    private String chatId; // Identifiant de la conversation
    private String fromUserId; // Expéditeur principal
    private String toUserId; // Destinataire principal
    @Builder.Default
    private List<MessageEntry> messages = new ArrayList<>(); // Liste des messages avec leur historique
    private Instant createdAt; // Date de création de l'historique
    private Instant updatedAt; // Date de la dernière mise à jour

    // Sous-classe pour représenter un message avec son historique
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageEntry {
        private String messageId; // ID du message original
        private String content; // Contenu actuel ou historique
        @Builder.Default
        private List<MessageVersion> history = new ArrayList<>(); // Historique des versions
        private boolean isDeleted; // Indicateur de suppression logique
        private String fromUserId; // Expéditeur du message
        private String toUserId; // Destinataire du message
        private Instant timestamp; // Timestamp du message (copie initiale)

        // Setter explicite pour isDeleted (facultatif, pour tester)
        public void setIsDeleted(boolean isDeleted) {
            this.isDeleted = isDeleted;
        }
    }

    // Sous-classe pour représenter une version dans l'historique d'un message
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageVersion {
        private Instant timestamp; // Date de l'action
        private String action; // "CREATED", "UPDATED", "DELETED"
        private String content; // Contenu à ce moment précis
    }
}