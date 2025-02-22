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
    private final UserRepository userRepository; // ✅ Vérifier si l'utilisateur existe avant l'ajout
    private final PortfolioService portfolioService; // ✅ Ajout du PortfolioService

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
        // ✅ Vérifier si l'utilisateur associé existe avant d'ajouter la langue
        Optional<User> user = userRepository.findById(language.getUserId());
        if (user.isEmpty()) {
            return Optional.empty(); // ✅ Retourne vide si l'utilisateur n'existe pas
        }

        Language savedLanguage = languageRepository.save(language);

        // ✅ Ajouter l'ID de la langue à l'utilisateur et mettre à jour le portfolio
        user.get().getLanguageIds().add(savedLanguage.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedLanguage);
    }

    public Optional<Language> updateLanguage(String id, Language updatedLanguage) {
        return languageRepository.findById(id).map(existingLanguage -> {
            existingLanguage.setName(updatedLanguage.getName());
            existingLanguage.setLevel(updatedLanguage.getLevel());

            return languageRepository.save(existingLanguage);
        });
    }

    public void deleteLanguage(String id) {
        languageRepository.findById(id).ifPresent(language -> {
            // ✅ Supprimer l'ID de la langue dans l'utilisateur
            userRepository.findById(language.getUserId()).ifPresent(user -> {
                user.getLanguageIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            languageRepository.deleteById(id);
        });
    }
}
