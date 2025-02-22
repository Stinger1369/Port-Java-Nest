package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Recommendation;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.RecommendationRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository; // ✅ Vérifier l'existence de l'utilisateur
    private final PortfolioService portfolioService; // ✅ Mise à jour automatique du portfolio

    public List<Recommendation> getAllRecommendations() {
        return recommendationRepository.findAll();
    }

    public List<Recommendation> getRecommendationsByUserId(String userId) {
        return recommendationRepository.findByUserId(userId);
    }

    public List<Recommendation> getRecommendationsByRecommenderId(String recommenderId) {
        return recommendationRepository.findByRecommenderId(recommenderId);
    }

    public Optional<Recommendation> getRecommendationById(String id) {
        return recommendationRepository.findById(id);
    }

    public Optional<Recommendation> createRecommendation(Recommendation recommendation) {
        recommendation.setCreatedAt(LocalDateTime.now()); // ✅ Ajouter la date de création

        // ✅ Vérifier si l'utilisateur existe avant d'ajouter la recommandation
        Optional<User> userOptional = userRepository.findById(recommendation.getUserId());
        if (userOptional.isEmpty()) {
            return Optional.empty();
        }

        Recommendation savedRecommendation = recommendationRepository.save(recommendation);

        // ✅ Ajouter l'ID de la recommandation à l'utilisateur et mettre à jour le portfolio
        User user = userOptional.get();
        user.getRecommendationIds().add(savedRecommendation.getId());
        userRepository.save(user);
        portfolioService.updatePortfolioWithUserData(user.getId());

        return Optional.of(savedRecommendation);
    }

    public Optional<Recommendation> updateRecommendation(String id, Recommendation updatedRecommendation) {
        return recommendationRepository.findById(id).map(existingRecommendation -> {
            existingRecommendation.setContent(updatedRecommendation.getContent());

            Recommendation savedRecommendation = recommendationRepository.save(existingRecommendation);
            portfolioService.updatePortfolioWithUserData(existingRecommendation.getUserId()); // ✅ Mise à jour auto du portfolio

            return savedRecommendation;
        });
    }

    public void deleteRecommendation(String id) {
        recommendationRepository.findById(id).ifPresent(recommendation -> {
            // ✅ Supprimer l'ID de la recommandation dans l'utilisateur
            userRepository.findById(recommendation.getUserId()).ifPresent(user -> {
                user.getRecommendationIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            recommendationRepository.deleteById(id);
        });
    }
}
