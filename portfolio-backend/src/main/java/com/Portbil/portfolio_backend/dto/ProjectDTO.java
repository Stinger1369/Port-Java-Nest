package com.Portbil.portfolio_backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDTO {
    private String id;
    private String userId;
    private String title;
    private String description;
    private String repositoryUrl;
    private String liveDemoUrl;
    private String link;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean currentlyWorkingOn;
    private List<String> technologies;
    private boolean isPublic; // Ajouté
}