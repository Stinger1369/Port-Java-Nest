package com.Portbil.portfolio_backend.dto;

import com.Portbil.portfolio_backend.entity.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioInternalDTO {
    private String id;
    private String userId;
    private boolean isPublic;
    private List<PortfolioCard> cards; // Préférences des cartes
    private List<Education> educations;
    private List<Experience> experiences;
    private List<Skill> skills;
    private List<Project> projects;
    private List<Certification> certifications;
    private List<SocialLink> socialLinks;
    private List<Language> languages;
    private List<Recommendation> recommendations;
    private List<Interest> interests;
    private List<String> imageIds; // Ajout des imageIds pour le portfolio interne
}