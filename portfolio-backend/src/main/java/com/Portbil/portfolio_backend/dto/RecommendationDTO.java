package com.Portbil.portfolio_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationDTO {
    private String id;
    private String userId;
    private String recommenderId;
    private String content;
    private LocalDateTime createdAt;
}
