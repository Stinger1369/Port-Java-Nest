package com.Portbil.portfolio_backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ExperienceDTO {
    private String companyName;
    private String jobTitle;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean currentlyWorking;
    private String description;
    private boolean isPublic; // Ajouté
}