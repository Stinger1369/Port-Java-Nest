// package com.Portbil.portfolio_backend.dto;

import com.Portbil.portfolio_backend.entity.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioDTO {
    private String id;
    private String userId;
    private boolean isPublic;

    // Liste des préférences des cartes
    private List<PortfolioCard> cards;

    // Liste complète des sections avec leurs objets
    private List<Education> educations;
    private List<Experience> experiences;
    private List<Skill> skills;
    private List<Project> projects;
    private List<Certification> certifications;
    private List<SocialLink> socialLinks;
    private List<Language> languages;
    private List<Recommendation> recommendations;
    private List<Interest> interests;

    // Ajouter les IDs des sections pour le mappage côté frontend
    private List<String> educationIds;
    private List<String> experienceIds;
    private List<String> skillIds;
    private List<String> projectIds;
    private List<String> certificationIds;
    private List<String> socialLinkIds;
    private List<String> languageIds;
    private List<String> recommendationIds;
    private List<String> interestIds;

    // Ajouter les imageIds si disponibles
    private List<String> imageIds;
}