package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.SocialLink;
import com.Portbil.portfolio_backend.service.SocialLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/social-links")
@RequiredArgsConstructor
public class SocialLinkController {

    private final SocialLinkService socialLinkService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<SocialLink>> getAllSocialLinks() {
        return ResponseEntity.ok(socialLinkService.getAllSocialLinks());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<SocialLink>> getSocialLinksByUser(@PathVariable String userId) {
        return ResponseEntity.ok(socialLinkService.getSocialLinksByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocialLink> getSocialLinkById(@PathVariable String id) {
        return socialLinkService.getSocialLinkById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#socialLink.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createSocialLink(@RequestBody SocialLink socialLink) {
        Optional<SocialLink> createdSocialLink = socialLinkService.createSocialLink(socialLink);

        if (createdSocialLink.isPresent()) {
            return ResponseEntity.ok(createdSocialLink.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter le lien social.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@socialLinkService.getSocialLinkById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<SocialLink> updateSocialLink(@PathVariable String id, @RequestBody SocialLink socialLink) {
        return socialLinkService.updateSocialLink(id, socialLink)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@socialLinkService.getSocialLinkById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSocialLink(@PathVariable String id) {
        socialLinkService.deleteSocialLink(id);
        return ResponseEntity.noContent().build();
    }
}
