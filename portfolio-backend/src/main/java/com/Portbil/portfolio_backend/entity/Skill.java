package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur propriétaire du skill

    private String name; // ✅ Nom de la compétence

    private int level; // ✅ Niveau de la compétence (1-100)

    private String description; // ✅ Description facultative

}
