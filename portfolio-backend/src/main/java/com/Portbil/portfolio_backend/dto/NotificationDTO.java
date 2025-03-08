package com.Portbil.portfolio_backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationDTO {
    private String id;
    private String userId;
    private String type;
    private String message;
    private Instant timestamp;
    private Boolean isRead;
    private Map<String, String> data;
}