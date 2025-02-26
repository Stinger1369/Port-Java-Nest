package com.Portbil.portfolio_backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("🔹 Configuring SecurityFilterChain for /api/images/**");
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Configuration CORS appliquée en premier
                .csrf(csrf -> csrf.disable()) // Désactiver CSRF pour API REST stateless
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/verify",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/translations/**",
                                "/api/contacts/request"
                        ).permitAll() // Routes publiques
                        .requestMatchers("/api/portfolio/public/**").permitAll() // Rendre les portfolios accessibles publiquement
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll() // Autoriser toutes les requêtes OPTIONS
                        .requestMatchers("/api/users/all").authenticated() // Route protégée pour les utilisateurs authentifiés
                        .requestMatchers("/api/users/**").authenticated() // Protection des routes /api/users/*
                        .requestMatchers("/api/images/**").authenticated() // Protection explicite pour /api/images/**
                        .anyRequest().authenticated() // Tout le reste nécessite une authentification
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Pas de sessions
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class); // Filtre JWT

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil, userDetailsService);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        System.out.println("Applying CORS configuration");
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(List.of("http://localhost:5173")); // Autoriser le frontend
        corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")); // Méthodes autorisées
        corsConfig.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept")); // En-têtes autorisés
        corsConfig.setExposedHeaders(List.of("Authorization")); // Exposer Authorization pour le frontend
        corsConfig.setAllowCredentials(true); // Autoriser les credentials (cookies, JWT, etc.)
        corsConfig.setMaxAge(3600L); // Cache la réponse preflight pendant 1 heure

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig); // Appliquer à tous les endpoints
        return source;
    }
}