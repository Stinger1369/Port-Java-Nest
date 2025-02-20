package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Récupérer tous les utilisateurs
     * Accessible uniquement par un ADMIN
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Récupérer un utilisateur par son ID
     * Accessible uniquement par un ADMIN ou l'utilisateur lui-même
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or authentication.principal.id == #id")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Modifier un utilisateur
     * Accessible uniquement par l'utilisateur concerné
     */
    @PutMapping("/{id}")
    @PreAuthorize("authentication.principal.id == #id")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody UserDTO userDTO) {
        return userService.updateUser(id, userDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Supprimer un utilisateur
     * Accessible uniquement par un ADMIN ou l'utilisateur lui-même
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or authentication.principal.id == #id")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
