package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.security.JwtUtil;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final MessageSource messageSource;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String email = request.get("email");
        String password = request.get("password");
        Locale locale = Locale.forLanguageTag(lang);

        try {
            User newUser = userService.registerUser(email, password, locale);
            return ResponseEntity.ok(Map.of(
                    "message", messageSource.getMessage("user.registered.success", null, locale),
                    "id", newUser.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String email = request.get("email");
        String code = request.get("code");
        Locale locale = Locale.forLanguageTag(lang);

        try {
            boolean verified = userService.verifyUser(email, code, locale);
            if (verified) {
                return ResponseEntity.ok(Map.of("message", messageSource.getMessage("account.verified.success", null, locale)));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", messageSource.getMessage("invalid.verification.code", null, locale)));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerificationCode(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String email = request.get("email");
        Locale locale = Locale.forLanguageTag(lang);

        try {
            userService.resendVerificationCode(email, locale);
            return ResponseEntity.ok(Map.of("message", messageSource.getMessage("code.sent.success", null, locale)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> credentials,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        Locale locale = Locale.forLanguageTag(lang);

        System.out.println("🔹 Tentative de connexion pour : " + email);

        User user = userService.getUserByEmail(email).orElse(null);
        if (user == null) {
            System.out.println("❌ Utilisateur introuvable dans la base de données.");
            return ResponseEntity.status(403).body(Map.of("error", messageSource.getMessage("user.not.found", new Object[]{email}, locale)));
        }

        if (!user.isVerified()) {
            System.out.println("⚠️ Utilisateur trouvé mais non vérifié : " + email);
            return ResponseEntity.status(403).body(Map.of("error", messageSource.getMessage("account.not.verified", null, locale)));
        }

        if (!userService.checkPassword(user, password)) {
            System.out.println("❌ Mot de passe incorrect pour l'utilisateur : " + email);
            return ResponseEntity.status(403).body(Map.of("error", messageSource.getMessage("invalid.password", null, locale)));
        }

        try {
            System.out.println("✅ Vérification via AuthenticationManager...");
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            System.out.println("❌ Échec de l'authentification pour " + email + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(403).body(Map.of("error", messageSource.getMessage("authentication.failed", null, locale)));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        System.out.println("✅ Connexion réussie pour " + email + " - Tokens générés.");
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "userId", user.getId()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String refreshToken = request.get("refreshToken");
        Locale locale = Locale.forLanguageTag(lang);

        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("error", messageSource.getMessage("missing.refresh.token", null, locale)));
        }

        try {
            String userId = jwtUtil.extractUserId(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userId);
            if (jwtUtil.validateToken(refreshToken, userDetails)) {
                String newAccessToken = jwtUtil.generateAccessToken(userDetails);
                return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
            } else {
                return ResponseEntity.status(401).body(Map.of("error", messageSource.getMessage("invalid.refresh.token", null, locale)));
            }
        } catch (Exception e) {
            System.out.println("🔴 Erreur lors du refresh du token: " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", messageSource.getMessage("invalid.refresh.token", null, locale)));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String email = request.get("email");
        Locale locale = Locale.forLanguageTag(lang);

        try {
            userService.forgotPassword(email, locale);
            return ResponseEntity.ok(Map.of("message", messageSource.getMessage("password.reset.sent", null, locale)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        Locale locale = Locale.forLanguageTag(lang);

        try {
            userService.resetPassword(token, newPassword, locale);
            SecurityContextHolder.clearContext();
            return ResponseEntity.ok(Map.of("message", messageSource.getMessage("password.reset.success", null, locale)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}