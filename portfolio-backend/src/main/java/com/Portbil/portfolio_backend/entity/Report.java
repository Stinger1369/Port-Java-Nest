package com.Portbil.portfolio_backend.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@Document(collection = "reports")
public class Report {
    @Id
    private String id;
    private String reporterId;
    private String reportedId;
    private String reason;
    private String messageId; // Optionnel, lien vers un message
    private String chatId;    // Optionnel, lien vers un tchat
    private Instant timestamp;
    private String status;    // "PENDING", "REVIEWED", "RESOLVED"
}