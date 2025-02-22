package com.Portbil.portfolio_backend.entity;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioCard {
    private String section; // Ex: "experience", "education", "skills"
    private int position; // ✅ Position de la carte dans la grille
    private String size; // ✅ Taille de la carte ("small", "medium", "large")
}
