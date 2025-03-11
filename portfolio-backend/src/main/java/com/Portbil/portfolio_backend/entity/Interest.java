package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

@Document(collection = "interests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interest {

    @Id
    private String id;

    private String userId;
    private String name;
    private String description;
    @JsonProperty("isPublic") // Assure que le champ JSON "isPublic" est mappé à isPublic
    private boolean isPublic;
}