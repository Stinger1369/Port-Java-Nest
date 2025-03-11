package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.PortfolioCardPreferencesDTO;
import com.Portbil.portfolio_backend.service.PortfolioCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio/cards")
@RequiredArgsConstructor
public class PortfolioCardController {

    private final PortfolioCardService portfolioCardService;

    @PostMapping("/user/{userId}/customize")
    public ResponseEntity<?> customizePortfolioCards(
            @PathVariable String userId,
            @RequestBody List<PortfolioCardPreferencesDTO> preferences) {
        return portfolioCardService.customizePortfolioCards(userId, preferences)
                .map(portfolio -> ResponseEntity.ok().build())
                .orElse(ResponseEntity.notFound().build());
    }
}