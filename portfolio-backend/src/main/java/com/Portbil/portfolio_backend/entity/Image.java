package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Image {
    @Id
    private String id;              // ID unique généré par MongoDB
    private String userId;          // ID de l'utilisateur
    private String name;            // Nom de l'image (ex. "photo1.jpg")
    private String path;            // Chemin dans le serveur Go (ex. "images/user123/photo1.jpg")
    private boolean isNSFW;         // Statut NSFW
    private LocalDateTime uploadedAt; // Date d'upload
}