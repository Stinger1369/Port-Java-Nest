package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Interest;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.InterestRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InterestService {

    private final InterestRepository interestRepository;
    private final UserRepository userRepository; // ✅ Vérifier si l'utilisateur existe avant l'ajout
    private final PortfolioService portfolioService; // ✅ Ajout du PortfolioService

    public List<Interest> getAllInterests() {
        return interestRepository.findAll();
    }

    public List<Interest> getInterestsByUserId(String userId) {
        return interestRepository.findByUserId(userId);
    }

    public Optional<Interest> getInterestById(String id) {
        return interestRepository.findById(id);
    }

    public Optional<Interest> createInterest(Interest interest) {
        // ✅ Vérifier si l'utilisateur associé existe avant d'ajouter l'intérêt
        Optional<User> user = userRepository.findById(interest.getUserId());
        if (user.isEmpty()) {
            return Optional.empty(); // ✅ Retourne vide si l'utilisateur n'existe pas
        }

        Interest savedInterest = interestRepository.save(interest);

        // ✅ Ajouter l'ID de l'intérêt à l'utilisateur et mettre à jour le portfolio
        user.get().getInterestIds().add(savedInterest.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedInterest);
    }

    public Optional<Interest> updateInterest(String id, Interest updatedInterest) {
        return interestRepository.findById(id).map(existingInterest -> {
            existingInterest.setName(updatedInterest.getName());
            existingInterest.setDescription(updatedInterest.getDescription());

            return interestRepository.save(existingInterest);
        });
    }

    public void deleteInterest(String id) {
        interestRepository.findById(id).ifPresent(interest -> {
            // ✅ Supprimer l'ID de l'intérêt dans l'utilisateur
            userRepository.findById(interest.getUserId()).ifPresent(user -> {
                user.getInterestIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            interestRepository.deleteById(id);
        });
    }
}
