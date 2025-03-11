package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

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

    private String userId;

    private String companyName;
    private String jobTitle;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean currentlyWorking;
    private String description;

    @JsonProperty("isPublic")
    private boolean isPublic;
}