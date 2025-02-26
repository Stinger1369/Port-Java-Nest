package com.Portbil.portfolio_backend.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageDTO {
    private String id;
    @NotBlank(message = "L'ID de l'utilisateur est requis")
    private String userId;
    @NotBlank(message = "Le nom de l'image est requis")
    private String name;
    private String path;
    private boolean isNSFW;
    private LocalDateTime uploadedAt;
}