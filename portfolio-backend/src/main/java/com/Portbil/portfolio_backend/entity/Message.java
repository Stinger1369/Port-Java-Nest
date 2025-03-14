package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private String id;
    private String type; // "private" ou "group_message"
    private String fromUserId;
    private String toUserId; // Null pour les messages de groupe
    private String groupId; // Null pour les messages privés
    private String chatId; // Champ pour lier à une conversation
    private String content;
    private Instant timestamp;
    @Builder.Default
    private boolean isDeleted = false; // Champ pour la suppression logique, par défaut false

    // Setter explicite pour isDeleted (facultatif, pour tester)
    public void setIsDeleted(boolean isDeleted) {
        this.isDeleted = isDeleted;
    }
}