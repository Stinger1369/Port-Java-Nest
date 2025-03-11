package com.Portbil.portfolio_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SkillDto {
    private String userId;
    private String name;
    private int level;
    private String description;
    private boolean isPublic; // Ajouté
}