package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    private String id;

    private String userId; // ✅ ID de l'utilisateur propriétaire du projet
    private String title; // ✅ Nom du projet
    private String description; // ✅ Description du projet
    private String repositoryUrl; // ✅ Lien vers le repo GitHub ou GitLab
    private String liveDemoUrl; // ✅ Lien vers la version en ligne (optionnel)
    private String link; // ✅ Champ existant (optionnel)
    private String repository; // ✅ Nouveau champ pour mapper "repository" du frontend
    private LocalDate startDate; // ✅ Date de début du projet
    private LocalDate endDate; // ✅ Date de fin (optionnel)
    private boolean currentlyWorkingOn; // ✅ Indique si le projet est encore en cours
    private List<String> technologies; // ✅ Liste des technologies utilisées
}