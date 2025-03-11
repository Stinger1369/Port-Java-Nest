package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "portfolios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Portfolio {

    @Id
    private String id;
    private String userId; // Référence à l'utilisateur propriétaire
    private List<PortfolioCard> cards; // Configuration des cartes du portfolio
    private boolean isPublic; // Indique si le portfolio est visible publiquement
}