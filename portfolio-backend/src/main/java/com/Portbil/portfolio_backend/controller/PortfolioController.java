package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.PortfolioDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final UserRepository userRepository;

    // ✅ Récupérer le portfolio complet avec toutes les sections par `userId`
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

    // ✅ Route publique : récupérer un portfolio via `firstName`, `lastName` et `slug`
    @GetMapping("/public/{firstName}/{lastName}/{slug}")
    public ResponseEntity<PortfolioDTO> getPublicPortfolio(
            @PathVariable String firstName,
            @PathVariable String lastName,
            @PathVariable String slug) {
        System.out.println("🔹 Requête reçue pour le portfolio de : " + firstName + " " + lastName + " (" + slug + ")");

        // 🔹 Étape 1 : Chercher l'utilisateur par slug
        Optional<User> userOpt = userRepository.findBySlug(slug);

        // Vérifier si l'utilisateur existe et si le firstName/lastName correspondent
        if (userOpt.isEmpty() || !userOpt.get().getFirstName().equalsIgnoreCase(firstName) || !userOpt.get().getLastName().equalsIgnoreCase(lastName)) {
            System.out.println("❌ Aucun utilisateur trouvé avec slug : " + slug + " ou nom/prénom incorrect");
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        System.out.println("✅ Utilisateur trouvé : " + user.getEmail() + " | ID: " + user.getId());

        // 🔹 Étape 2 : Vérifier si le portfolio existe
        Optional<PortfolioDTO> portfolioOpt = portfolioService.getPortfolioWithDetails(user.getId());

        if (portfolioOpt.isEmpty()) {
            System.out.println("❌ Aucun portfolio trouvé pour : " + firstName + " " + lastName + " (" + slug + ")");
            return ResponseEntity.notFound().build();
        }

        System.out.println("✅ Portfolio trouvé pour " + firstName + " " + lastName + " (" + slug + ")");
        return ResponseEntity.ok(portfolioOpt.get());
    }
}