package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    /**
     * ✅ Récupérer tous les utilisateurs (réservé aux admins)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("🔹 Récupération de la liste des utilisateurs (admin).");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * ✅ Récupérer tous les utilisateurs pour les utilisateurs authentifiés
     */
    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsersForAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getName())) {
            System.out.println("❌ Tentative d'accès non authentifié à /api/users/all");
            return ResponseEntity.status(403).body(null);
        }

        System.out.println("🔹 Récupération de la liste des utilisateurs pour l'utilisateur authentifié: " + authentication.getName());
        List<User> users = userService.getAllUsers();

        // Convertir en DTO pour ne pas exposer toutes les données sensibles
        List<UserDTO> userDTOs = users.stream().map(user -> UserDTO.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phone(user.getPhone())
                        .slug(user.getSlug())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(userDTOs);
    }

    /**
     * ✅ Récupérer un utilisateur par son ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or #id == authentication.principal.username")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        System.out.println("🔹 Tentative de récupération de l'utilisateur ID: " + id);
        Optional<User> user = userService.getUserById(id);
        if (user.isEmpty()) {
            System.out.println("❌ Utilisateur non trouvé : " + id);
            return ResponseEntity.notFound().build();
        }
        System.out.println("✅ Utilisateur trouvé : " + user.get().getEmail());
        System.out.println("Phone renvoyé au frontend : " + user.get().getPhone());
        return ResponseEntity.ok(user.get());
    }

    /**
     * ✅ Modifier un utilisateur
     */
    @PutMapping("/{id}")
    @PreAuthorize("#id == authentication.principal.username")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserDTO userDTO) {
        log.debug("Requête PUT reçue pour l'utilisateur ID: {}, JSON brut reçu: {}", id, userDTO != null ? userDTO.toString() : "null");
        log.info("Début du traitement de la mise à jour pour l'utilisateur ID: {}", id);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        log.debug("Authentification récupérée : {}", authentication != null ? authentication.getName() : "null");

        System.out.println("🔹 Tentative de mise à jour de l'utilisateur ID: " + id);
        System.out.println("Received phone from frontend: " + (userDTO != null ? userDTO.getPhone() : "null"));
        System.out.println("🔹 Coordonnées reçues du frontend: latitude=" + (userDTO != null ? userDTO.getLatitude() : "null") + ", longitude=" + (userDTO != null ? userDTO.getLongitude() : "null"));

        if (authentication == null || authentication.getPrincipal() == null) {
            log.error("❌ Utilisateur non authentifié !");
            return ResponseEntity.status(403).body("Accès interdit : utilisateur non authentifié !");
        }

        String authenticatedUserId = authentication.getName();

        log.debug("Utilisateur connecté avec ID : {}", authenticatedUserId);

        if (!authenticatedUserId.equals(id)) {
            log.warn("❌ Erreur : L'utilisateur {} ne peut modifier que son propre compte (ID: {}) !", authenticatedUserId, id);
            return ResponseEntity.status(403).body("Accès interdit : vous ne pouvez modifier que votre propre compte !");
        }

        try {
            log.debug("Tentative de mise à jour de l'utilisateur avec les données : latitude={}, longitude={}",
                    userDTO != null ? userDTO.getLatitude() : "null",
                    userDTO != null ? userDTO.getLongitude() : "null");

            Optional<User> updatedUser = userService.updateUser(id, userDTO);
            if (updatedUser.isEmpty()) {
                log.error("❌ Mise à jour impossible, utilisateur non trouvé : {}", id);
                return ResponseEntity.notFound().build();
            }

            log.info("✅ Mise à jour réussie pour l'utilisateur ID: {}", id);
            System.out.println("✅ Mise à jour réussie pour l'utilisateur ID: " + id);
            System.out.println("Saved phone in DB: " + updatedUser.get().getPhone());
            System.out.println("🔹 Nouvelles coordonnées enregistrées: latitude=" + updatedUser.get().getLatitude() + ", longitude=" + updatedUser.get().getLongitude());
            return ResponseEntity.ok(updatedUser.get());
        } catch (IllegalArgumentException e) {
            log.error("⚠️ Erreur lors de la mise à jour : {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la mise à jour de l'utilisateur ID: {} - Message: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Erreur interne : " + e.getMessage());
        }
    }

    /**
     * ✅ Supprimer un utilisateur
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

        String authenticatedUserId = authentication.getName();

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