package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Experience;
import com.Portbil.portfolio_backend.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Experience>> getAllExperiences() {
        return ResponseEntity.ok(experienceService.getAllExperiences());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Experience>> getExperiencesByUser(@PathVariable String userId) {
        return ResponseEntity.ok(experienceService.getExperiencesByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Experience> getExperienceById(@PathVariable String id) {
        return experienceService.getExperienceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#experience.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createExperience(@RequestBody Experience experience) {
        Optional<Experience> createdExperience = experienceService.createExperience(experience);

        if (createdExperience.isPresent()) {
            return ResponseEntity.ok(createdExperience.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter l'expérience.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@experienceService.getExperienceById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Experience> updateExperience(@PathVariable String id, @RequestBody Experience experience) {
        System.out.println("Updating experience with ID: " + id + ", isPublic: " + experience.isPublic());
        return experienceService.updateExperience(id, experience)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@experienceService.getExperienceById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteExperience(@PathVariable String id) {
        experienceService.deleteExperience(id);
        return ResponseEntity.noContent().build();
    }
}