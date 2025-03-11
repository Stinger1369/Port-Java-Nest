package com.Portbil.portfolio_backend.dto;

import com.Portbil.portfolio_backend.entity.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioPublicDTO {
    private String id;
    private String userId;
    private boolean isPublic;
    private List<PortfolioCard> cards; // Préférences de présentation
    private String firstName;
    private String lastName;
    private String profilePictureUrl; // Image publique
    private String bio; // Bio publique
    private List<Project> projects; // Sections publiques
    private List<Certification> certifications; // Certifications publiques
    private List<SocialLink> socialLinks; // Liens sociaux publics
    private List<Education> educations; // Éducations publiques
    private List<Experience> experiences; // Expériences publiques
}