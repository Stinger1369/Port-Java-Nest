package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Education;
import com.Portbil.portfolio_backend.service.EducationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/educations")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Education>> getAllEducations() {
        return ResponseEntity.ok(educationService.getAllEducations());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Education>> getEducationsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(educationService.getEducationsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Education> getEducationById(@PathVariable String id) {
        return educationService.getEducationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#education.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createEducation(@RequestBody Education education) {
        Optional<Education> createdEducation = educationService.createEducation(education);

        if (createdEducation.isPresent()) {
            return ResponseEntity.ok(createdEducation.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter l'éducation.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@educationService.getEducationById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Education> updateEducation(@PathVariable String id, @RequestBody Education education) {
        return educationService.updateEducation(id, education)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@educationService.getEducationById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteEducation(@PathVariable String id) {
        educationService.deleteEducation(id);
        return ResponseEntity.noContent().build();
    }
}
