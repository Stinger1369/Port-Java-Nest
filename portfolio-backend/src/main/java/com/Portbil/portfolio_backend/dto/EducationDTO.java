package com.Portbil.portfolio_backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EducationDTO {
    private String schoolName;
    private String degree;
    private String fieldOfStudy;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private boolean currentlyStudying;
    private boolean isPublic; // Ajouté
}