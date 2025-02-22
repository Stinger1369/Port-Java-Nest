package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "experiences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Experience {

    @Id
    private String id;

    private String userId; // ✅ Ajout de l'ID utilisateur pour la liaison

    private String companyName; // ✅ Nom de l'entreprise
    private String jobTitle; // ✅ Titre du poste
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean currentlyWorking; // ✅ Indique si l'utilisateur y travaille encore
    private String description; // ✅ Description optionnelle

}
