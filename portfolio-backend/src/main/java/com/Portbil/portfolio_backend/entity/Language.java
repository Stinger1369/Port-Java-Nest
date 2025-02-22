package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "languages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Language {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur propriétaire de la langue
    private String name; // ✅ Nom de la langue (ex: Français, Anglais, Espagnol)
    private String level; // ✅ Niveau (ex: Débutant, Intermédiaire, Avancé, Courant, Natif)
}
