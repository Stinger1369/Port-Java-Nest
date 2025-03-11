package com.Portbil.portfolio_backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioCardPreferencesDTO {
    private String section; // Ex: "education", "experience", "skills"
    private int position;   // Position dans la grille
    private String size;    // "small", "medium", "large"
    private String shape;   // "square", "rectangle"
}