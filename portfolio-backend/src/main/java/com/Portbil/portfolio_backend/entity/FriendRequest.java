package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "friendRequests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRequest {
    @Id
    private String id;

    private User sender;
    private User receiver;
    private String status; // PENDING, ACCEPTED, REJECTED, CANCELED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}