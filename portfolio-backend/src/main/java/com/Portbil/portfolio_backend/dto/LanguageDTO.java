package com.Portbil.portfolio_backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageDTO {
    private String id;
    private String userId;
    private String name;
    private String level;
}
