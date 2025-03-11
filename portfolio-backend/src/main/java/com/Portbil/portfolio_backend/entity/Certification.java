package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonProperty; // Assurez-vous que cet import est présent

@Document(collection = "certifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certification {

    @Id
    private String id;

    private String userId;
    private String name;
    private String organization;
    private LocalDate dateObtained;
    private LocalDate expirationDate;
    private boolean doesNotExpire;
    private String credentialId;
    private String credentialUrl;
    @JsonProperty("isPublic")
    private boolean isPublic;
}