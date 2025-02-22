package com.Portbil.portfolio_backend.dto;

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

    // ✅ Liste complète des sections avec leurs objets (au lieu des simples IDs)
    private List<Education> educations;
    private List<Experience> experiences;
    private List<Skill> skills;
    private List<Project> projects;
    private List<Certification> certifications;
    private List<SocialLink> socialLinks;
    private List<Language> languages;
    private List<Recommendation> recommendations;
    private List<Interest> interests;
}
