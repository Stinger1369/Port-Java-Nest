package com.Portbil.portfolio_backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialLinkDTO {
    private String id;
    private String userId;
    private String platform;
    private String url;
    private boolean isPublic; // Ajouté
}