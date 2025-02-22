package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.PortfolioDTO;
import com.Portbil.portfolio_backend.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    // ✅ Récupérer le portfolio complet avec toutes les sections
    @GetMapping("/user/{userId}")
    public ResponseEntity<PortfolioDTO> getPortfolioByUser(@PathVariable String userId) {
        return portfolioService.getPortfolioWithDetails(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Mettre à jour le portfolio automatiquement
    @PostMapping("/user/{userId}/update")
    public ResponseEntity<PortfolioDTO> updatePortfolio(@PathVariable String userId) {
        return portfolioService.getPortfolioWithDetails(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
