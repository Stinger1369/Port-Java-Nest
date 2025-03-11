package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Language;
import com.Portbil.portfolio_backend.service.LanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/languages")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageService languageService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Language>> getAllLanguages() {
        return ResponseEntity.ok(languageService.getAllLanguages());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Language>> getLanguagesByUser(@PathVariable String userId) {
        return ResponseEntity.ok(languageService.getLanguagesByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Language> getLanguageById(@PathVariable String id) {
        return languageService.getLanguageById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#language.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createLanguage(@RequestBody Language language) {
        Optional<Language> createdLanguage = languageService.createLanguage(language);

        if (createdLanguage.isPresent()) {
            return ResponseEntity.ok(createdLanguage.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter la langue.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@languageService.getLanguageById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Language> updateLanguage(@PathVariable String id, @RequestBody Language language) {
        System.out.println("Updating language with ID: " + id + ", isPublic: " + language.isPublic());
        return languageService.updateLanguage(id, language)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@languageService.getLanguageById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteLanguage(@PathVariable String id) {
        languageService.deleteLanguage(id);
        return ResponseEntity.noContent().build();
    }
}