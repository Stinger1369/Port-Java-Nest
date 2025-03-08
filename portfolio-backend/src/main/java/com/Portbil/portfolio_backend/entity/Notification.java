package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;
    private String userId;
    private String type;
    private String message;
    private Instant timestamp;
    private boolean isRead;
    private Map<String, String> data;

    // Setter explicite pour isRead (temporaire)
    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }
}