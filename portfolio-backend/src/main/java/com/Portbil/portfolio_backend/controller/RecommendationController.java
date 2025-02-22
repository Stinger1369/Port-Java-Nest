package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Recommendation;
import com.Portbil.portfolio_backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Recommendation>> getAllRecommendations() {
        return ResponseEntity.ok(recommendationService.getAllRecommendations());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Recommendation>> getRecommendationsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(recommendationService.getRecommendationsByUserId(userId));
    }

    @GetMapping("/recommender/{recommenderId}")
    @PreAuthorize("#recommenderId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Recommendation>> getRecommendationsByRecommender(@PathVariable String recommenderId) {
        return ResponseEntity.ok(recommendationService.getRecommendationsByRecommenderId(recommenderId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recommendation> getRecommendationById(@PathVariable String id) {
        return recommendationService.getRecommendationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#recommendation.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createRecommendation(@RequestBody Recommendation recommendation) {
        Optional<Recommendation> createdRecommendation = recommendationService.createRecommendation(recommendation);

        if (createdRecommendation.isPresent()) {
            return ResponseEntity.ok(createdRecommendation.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter la recommandation.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@recommendationService.getRecommendationById(#id).get().recommenderId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Recommendation> updateRecommendation(@PathVariable String id, @RequestBody Recommendation recommendation) {
        return recommendationService.updateRecommendation(id, recommendation)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@recommendationService.getRecommendationById(#id).get().recommenderId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteRecommendation(@PathVariable String id) {
        recommendationService.deleteRecommendation(id);
        return ResponseEntity.noContent().build();
    }
}
