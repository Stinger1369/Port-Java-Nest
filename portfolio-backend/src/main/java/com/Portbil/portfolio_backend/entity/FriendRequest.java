package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "friend_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRequest {

    @Id
    private String id;

    @DBRef
    private User sender; // L'utilisateur qui envoie la demande

    @DBRef
    private User receiver; // L'utilisateur qui reçoit la demande

    private String status; // "PENDING", "ACCEPTED", "REJECTED", "CANCELED"

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}