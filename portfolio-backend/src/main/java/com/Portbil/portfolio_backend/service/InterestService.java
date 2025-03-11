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
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;

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
        Optional<User> user = userRepository.findById(interest.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Interest savedInterest = interestRepository.save(interest);
        user.get().getInterestIds().add(savedInterest.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedInterest);
    }

    public Optional<Interest> updateInterest(String id, Interest updatedInterest) {
        return interestRepository.findById(id).map(existingInterest -> {
            existingInterest.setName(updatedInterest.getName());
            existingInterest.setDescription(updatedInterest.getDescription());
            existingInterest.setPublic(updatedInterest.isPublic()); // Ajout de la mise à jour de isPublic
            return interestRepository.save(existingInterest);
        });
    }

    public void deleteInterest(String id) {
        interestRepository.findById(id).ifPresent(interest -> {
            userRepository.findById(interest.getUserId()).ifPresent(user -> {
                user.getInterestIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            interestRepository.deleteById(id);
        });
    }
}