package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "certifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certification {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur propriétaire de la certification

    private String name; // ✅ Nom de la certification
    private String organization; // ✅ Organisme délivrant la certification
    private LocalDate dateObtained; // ✅ Date d'obtention
    private LocalDate expirationDate; // ✅ Date d'expiration (optionnel)
    private boolean doesNotExpire; // ✅ Indique si la certification n'expire jamais
    private String credentialId; // ✅ Identifiant de la certification (optionnel)
    private String credentialUrl; // ✅ Lien vers la certification (optionnel)
}
