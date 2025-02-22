package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "interests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interest {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur propriétaire du centre d'intérêt
    private String name; // ✅ Nom du centre d'intérêt
    private String description; // ✅ Description facultative
}
