package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.PortfolioInternalDTO;
import com.Portbil.portfolio_backend.dto.PortfolioPublicDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final UserRepository userRepository;

    // Récupérer le portfolio interne (avec token)
    @GetMapping("/user/{userId}")
    public ResponseEntity<PortfolioInternalDTO> getInternalPortfolio(@PathVariable String userId) {
        return portfolioService.getInternalPortfolio(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Mettre à jour le portfolio automatiquement
    @PostMapping("/user/{userId}/update")
    public ResponseEntity<PortfolioInternalDTO> updatePortfolio(@PathVariable String userId) {
        Optional<PortfolioInternalDTO> updatedPortfolio = portfolioService.updatePortfolioWithUserData(userId)
                .flatMap(portfolio -> portfolioService.getInternalPortfolio(userId));
        return updatedPortfolio.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Route publique : récupérer un portfolio via `firstName`, `lastName` et `slug` (sans token)
    @GetMapping("/public/{firstName}/{lastName}/{slug}")
    public ResponseEntity<PortfolioPublicDTO> getPublicPortfolio(
            @PathVariable String firstName,
            @PathVariable String lastName,
            @PathVariable String slug) {
        System.out.println("🔹 Requête reçue pour le portfolio de : " + firstName + " " + lastName + " (" + slug + ")");

        Optional<User> userOpt = userRepository.findBySlug(slug);

        if (userOpt.isEmpty() || !userOpt.get().getFirstName().equalsIgnoreCase(firstName) || !userOpt.get().getLastName().equalsIgnoreCase(lastName)) {
            System.out.println("❌ Aucun utilisateur trouvé avec slug : " + slug + " ou nom/prénom incorrect");
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        System.out.println("✅ Utilisateur trouvé : " + user.getEmail() + " | ID: " + user.getId());

        Optional<PortfolioPublicDTO> portfolioOpt = portfolioService.getPublicPortfolio(user.getId());

        if (portfolioOpt.isEmpty()) {
            System.out.println("❌ Aucun portfolio trouvé pour : " + firstName + " " + lastName + " (" + slug + ")");
            return ResponseEntity.notFound().build();
        }

        System.out.println("✅ Portfolio trouvé pour " + firstName + " " + lastName + " (" + slug + ")");
        return ResponseEntity.ok(portfolioOpt.get());
    }
}