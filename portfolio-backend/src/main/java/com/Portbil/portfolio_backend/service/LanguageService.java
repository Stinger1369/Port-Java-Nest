package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Language;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.LanguageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LanguageService {

    private final LanguageRepository languageRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;

    public List<Language> getAllLanguages() {
        return languageRepository.findAll();
    }

    public List<Language> getLanguagesByUserId(String userId) {
        return languageRepository.findByUserId(userId);
    }

    public Optional<Language> getLanguageById(String id) {
        return languageRepository.findById(id);
    }

    public Optional<Language> createLanguage(Language language) {
        Optional<User> user = userRepository.findById(language.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Language savedLanguage = languageRepository.save(language);
        user.get().getLanguageIds().add(savedLanguage.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedLanguage);
    }

    public Optional<Language> updateLanguage(String id, Language updatedLanguage) {
        return languageRepository.findById(id).map(existingLanguage -> {
            existingLanguage.setName(updatedLanguage.getName());
            existingLanguage.setLevel(updatedLanguage.getLevel());
            existingLanguage.setProficiencyLevel(updatedLanguage.getProficiencyLevel());
            existingLanguage.setPublic(updatedLanguage.isPublic()); // Ajout de la mise à jour de isPublic
            return languageRepository.save(existingLanguage);
        });
    }

    public void deleteLanguage(String id) {
        languageRepository.findById(id).ifPresent(language -> {
            userRepository.findById(language.getUserId()).ifPresent(user -> {
                user.getLanguageIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            languageRepository.deleteById(id);
        });
    }
}