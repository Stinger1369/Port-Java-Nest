package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Experience;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ExperienceRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;

    public List<Experience> getAllExperiences() {
        return experienceRepository.findAll();
    }

    public List<Experience> getExperiencesByUserId(String userId) {
        return experienceRepository.findByUserId(userId);
    }

    public Optional<Experience> getExperienceById(String id) {
        return experienceRepository.findById(id);
    }

    public Optional<Experience> createExperience(Experience experience) {
        Optional<User> user = userRepository.findById(experience.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        // Vider endDate si currentlyWorking est true
        if (experience.isCurrentlyWorking()) {
            experience.setEndDate(null);
        }

        Experience savedExperience = experienceRepository.save(experience);

        user.get().getExperienceIds().add(savedExperience.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedExperience);
    }

    public Optional<Experience> updateExperience(String id, Experience updatedExperience) {
        return experienceRepository.findById(id).map(existingExperience -> {
            existingExperience.setCompanyName(updatedExperience.getCompanyName());
            existingExperience.setJobTitle(updatedExperience.getJobTitle());
            existingExperience.setStartDate(updatedExperience.getStartDate());
            existingExperience.setEndDate(updatedExperience.getEndDate());
            existingExperience.setCurrentlyWorking(updatedExperience.isCurrentlyWorking());
            existingExperience.setDescription(updatedExperience.getDescription());
            existingExperience.setPublic(updatedExperience.isPublic());

            // Vider endDate si currentlyWorking est true
            if (existingExperience.isCurrentlyWorking()) {
                existingExperience.setEndDate(null);
            }

            return experienceRepository.save(existingExperience);
        });
    }

    public void deleteExperience(String id) {
        experienceRepository.findById(id).ifPresent(experience -> {
            userRepository.findById(experience.getUserId()).ifPresent(user -> {
                user.getExperienceIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            experienceRepository.deleteById(id);
        });
    }
}