package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "social_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialLink {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur propriétaire du lien social
    private String platform; // ✅ Nom de la plateforme (ex: LinkedIn, GitHub, Twitter)
    private String url; // ✅ Lien vers le profil social
}
