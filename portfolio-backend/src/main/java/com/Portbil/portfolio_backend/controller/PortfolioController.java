package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.PortfolioDTO;
import com.Portbil.portfolio_backend.entity.Portfolio;
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
    private final UserRepository userRepository; // ✅ Ajout pour récupérer l'utilisateur

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

    // ✅ Route publique : récupérer un portfolio via `firstName` et `lastName`
    @GetMapping("/public/{firstName}/{lastName}")
    public ResponseEntity<PortfolioDTO> getPublicPortfolio(@PathVariable String firstName, @PathVariable String lastName) {
        System.out.println("🔹 Requête reçue pour le portfolio de : " + firstName + " " + lastName);

        // 🔹 Étape 1 : Vérifier si l'utilisateur existe dans MongoDB
        Optional<User> userOpt = userRepository.findByFirstNameAndLastName(firstName, lastName);

        if (userOpt.isEmpty()) {
            System.out.println("❌ Aucun utilisateur trouvé avec : " + firstName + " " + lastName);

            // Debug supplémentaire : Vérification avec une recherche classique
            System.out.println("🔎 Vérification MongoDB : ");
            userRepository.findAll().forEach(user -> {
                System.out.println("👤 " + user.getFirstName() + " " + user.getLastName());
            });

            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        System.out.println("✅ Utilisateur trouvé : " + user.getEmail());

        // 🔹 Étape 2 : Vérifier si le portfolio existe
        Optional<PortfolioDTO> portfolioOpt = portfolioService.getPortfolioWithDetails(user.getId());

        if (portfolioOpt.isEmpty()) {
            System.out.println("❌ Aucun portfolio trouvé pour : " + firstName + " " + lastName);
            return ResponseEntity.notFound().build();
        }

        System.out.println("✅ Portfolio trouvé pour " + firstName + " " + lastName);
        return ResponseEntity.ok(portfolioOpt.get());
    }
}