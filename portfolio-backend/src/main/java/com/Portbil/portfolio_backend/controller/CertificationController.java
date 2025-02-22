package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Certification;
import com.Portbil.portfolio_backend.service.CertificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationService certificationService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Certification>> getAllCertifications() {
        return ResponseEntity.ok(certificationService.getAllCertifications());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Certification>> getCertificationsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(certificationService.getCertificationsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Certification> getCertificationById(@PathVariable String id) {
        return certificationService.getCertificationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#certification.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createCertification(@RequestBody Certification certification) {
        Optional<Certification> createdCertification = certificationService.createCertification(certification);

        if (createdCertification.isPresent()) {
            return ResponseEntity.ok(createdCertification.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter la certification.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@certificationService.getCertificationById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Certification> updateCertification(@PathVariable String id, @RequestBody Certification certification) {
        return certificationService.updateCertification(id, certification)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@certificationService.getCertificationById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteCertification(@PathVariable String id) {
        certificationService.deleteCertification(id);
        return ResponseEntity.noContent().build();
    }
}
