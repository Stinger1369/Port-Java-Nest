package com.Portbil.portfolio_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRequestDTO {

    private String id;
    private String senderId;
    private String receiverId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}