package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.Interest;
import com.Portbil.portfolio_backend.service.InterestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/interests")
@RequiredArgsConstructor
public class InterestController {

    private final InterestService interestService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Interest>> getAllInterests() {
        return ResponseEntity.ok(interestService.getAllInterests());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<List<Interest>> getInterestsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(interestService.getInterestsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Interest> getInterestById(@PathVariable String id) {
        return interestService.getInterestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("#interest.userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<?> createInterest(@RequestBody Interest interest) {
        Optional<Interest> createdInterest = interestService.createInterest(interest);

        if (createdInterest.isPresent()) {
            return ResponseEntity.ok(createdInterest.get());
        } else {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé, impossible d'ajouter le centre d'intérêt.");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@interestService.getInterestById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Interest> updateInterest(@PathVariable String id, @RequestBody Interest interest) {
        System.out.println("Updating interest with ID: " + id + ", isPublic: " + interest.isPublic()); // Log pour déboguer
        return interestService.updateInterest(id, interest)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@interestService.getInterestById(#id).get().userId == authentication.name or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteInterest(@PathVariable String id) {
        interestService.deleteInterest(id);
        return ResponseEntity.noContent().build();
    }
}