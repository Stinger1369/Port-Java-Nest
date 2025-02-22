package com.Portbil.portfolio_backend.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificationDTO {
    private String id;
    private String userId;
    private String name;
    private String organization;
    private LocalDate dateObtained;
    private LocalDate expirationDate;
    private boolean doesNotExpire;
    private String credentialId;
    private String credentialUrl;
}
