package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.security.JwtUtil;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * ✅ Inscription de l'utilisateur avec envoi d'un email de confirmation.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            User newUser = userService.registerUser(email, password);
            return ResponseEntity.ok(Map.of(
                    "message", "User registered successfully. Check your email for validation code.",
                    "id", newUser.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * ✅ Vérification du compte avec un code reçu par email.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        boolean verified = userService.verifyUser(email, code);

        if (verified) {
            return ResponseEntity.ok(Map.of("message", "Account verified successfully."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code."));
        }
    }

    /**
     * ✅ Connexion de l'utilisateur après vérification du compte.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        System.out.println("🔹 Tentative de connexion pour : " + email);

        // Vérifier si l'utilisateur existe et est bien vérifié
        User user = userService.getUserByEmail(email).orElse(null);
        if (user == null) {
            System.out.println("❌ Utilisateur introuvable dans la base de données.");
            return ResponseEntity.status(403).body(Map.of("error", "User not found."));
        }

        if (!user.isVerified()) {
            System.out.println("⚠️ Utilisateur trouvé mais non vérifié : " + email);
            return ResponseEntity.status(403).body(Map.of("error", "Account not verified. Check your email."));
        }

        // ✅ Vérification du mot de passe
        if (!userService.checkPassword(user, password)) {
            System.out.println("❌ Mot de passe incorrect pour l'utilisateur : " + email);
            return ResponseEntity.status(403).body(Map.of("error", "Invalid password."));
        }

        // ✅ Authentification via AuthenticationManager
        try {
            System.out.println("✅ Vérification via AuthenticationManager...");
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            System.out.println("❌ Échec de l'authentification pour " + email + " - " + e.getMessage());
            e.printStackTrace(); // Afficher l'erreur complète dans la console
            return ResponseEntity.status(403).body(Map.of("error", "Authentication failed."));
        }

        // ✅ Génération du JWT
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String jwt = jwtUtil.generateToken(userDetails);

        System.out.println("✅ Connexion réussie pour " + email + " - Token généré.");

        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "userId", user.getId()
        ));
    }


    /**
     * ✅ Demande de réinitialisation du mot de passe avec expiration du token (15 minutes)
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        try {
            userService.forgotPassword(email);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent successfully. The link is valid for 15 minutes."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * ✅ Réinitialisation du mot de passe avec validation du token et vérification des anciens mots de passe.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        try {
            userService.resetPassword(token, newPassword);
            SecurityContextHolder.clearContext(); // ✅ Forcer la déconnexion après le reset
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. Please log in again."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
