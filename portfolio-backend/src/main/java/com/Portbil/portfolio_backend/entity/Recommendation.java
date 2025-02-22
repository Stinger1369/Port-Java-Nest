package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur recevant la recommandation
    private String recommenderId; // ✅ ID de l'utilisateur qui fait la recommandation
    private String content; // ✅ Contenu de la recommandation
    private LocalDateTime createdAt; // ✅ Date de création
}
