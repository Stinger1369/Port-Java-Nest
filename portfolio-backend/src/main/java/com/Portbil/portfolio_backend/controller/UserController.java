package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * ✅ Récupérer tous les utilisateurs
     * Accessible uniquement par un ADMIN
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("🔹 Récupération de la liste des utilisateurs.");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * ✅ Récupérer un utilisateur par son ID
     * Accessible uniquement par un ADMIN ou l'utilisateur lui-même
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or #id == authentication.principal.username") // ✅ Vérifie avec le nom d'utilisateur (email ou ID)
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        System.out.println("🔹 Tentative de récupération de l'utilisateur ID: " + id);

        Optional<User> user = userService.getUserById(id);
        if (user.isEmpty()) {
            System.out.println("❌ Utilisateur non trouvé : " + id);
            return ResponseEntity.notFound().build();
        }

        System.out.println("✅ Utilisateur trouvé : " + user.get().getEmail());
        System.out.println("Phone renvoyé au frontend : " + user.get().getPhone()); // Log pour vérifier
        return ResponseEntity.ok(user.get());
    }

    /**
     * ✅ Modifier un utilisateur (Vérification d'authentification ajoutée)
     * Accessible uniquement par l'utilisateur concerné
     */
    @PutMapping("/{id}")
    @PreAuthorize("#id == authentication.principal.username") // ✅ Vérifie si l'ID de l'utilisateur connecté correspond
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserDTO userDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        System.out.println("🔹 Tentative de mise à jour de l'utilisateur ID: " + id);
        System.out.println("Received phone from frontend: " + userDTO.getPhone()); // Log avant traitement

        if (authentication == null || authentication.getPrincipal() == null) {
            System.out.println("❌ Utilisateur non authentifié !");
            return ResponseEntity.status(403).body("Accès interdit : utilisateur non authentifié !");
        }

        String authenticatedUserId = authentication.getName(); // 🔹 Récupère l'ID utilisateur stocké dans SecurityContextHolder

        System.out.println("✅ Utilisateur connecté avec ID : " + authenticatedUserId);

        if (!authenticatedUserId.equals(id)) {
            System.out.println("❌ Erreur : L'utilisateur ne peut modifier que son propre compte !");
            return ResponseEntity.status(403).body("Accès interdit : vous ne pouvez modifier que votre propre compte !");
        }

        try {
            Optional<User> updatedUser = userService.updateUser(id, userDTO);
            if (updatedUser.isEmpty()) {
                System.out.println("❌ Mise à jour impossible, utilisateur non trouvé : " + id);
                return ResponseEntity.notFound().build();
            }

            System.out.println("✅ Mise à jour réussie pour l'utilisateur ID: " + id);
            System.out.println("Saved phone in DB: " + updatedUser.get().getPhone()); // Log après mise à jour
            return ResponseEntity.ok(updatedUser.get());

        } catch (IllegalArgumentException e) {
            System.out.println("⚠️ Erreur lors de la mise à jour : " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * ✅ Supprimer un utilisateur
     * Accessible uniquement par un ADMIN ou l'utilisateur lui-même
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or #id == authentication.principal.username")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        System.out.println("🔹 Tentative de suppression de l'utilisateur ID: " + id);

        if (authentication == null || authentication.getPrincipal() == null) {
            System.out.println("❌ Utilisateur non authentifié !");
            return ResponseEntity.status(403).build();
        }

        String authenticatedUserId = authentication.getName(); // 🔹 L'ID de l'utilisateur connecté

        System.out.println("✅ Utilisateur connecté avec ID : " + authenticatedUserId);

        if (!authenticatedUserId.equals(id) && !authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ADMIN"))) {
            System.out.println("❌ Erreur : Accès interdit !");
            return ResponseEntity.status(403).build();
        }

        try {
            userService.deleteUser(id);
            System.out.println("✅ Suppression réussie pour l'utilisateur ID: " + id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Erreur lors de la suppression : " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}