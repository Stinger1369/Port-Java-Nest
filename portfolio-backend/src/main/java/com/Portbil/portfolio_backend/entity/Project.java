package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

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

    private String userId;
    private String title;
    private String description;
    private String repositoryUrl;
    private String liveDemoUrl;
    private String link;
    private String repository;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean currentlyWorkingOn;
    private List<String> technologies;
    @JsonProperty("isPublic")
    private boolean isPublic;
}