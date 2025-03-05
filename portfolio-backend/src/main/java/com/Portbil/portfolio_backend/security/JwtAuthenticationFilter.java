package com.Portbil.portfolio_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Laisser passer les requêtes OPTIONS pour CORS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String userId = null;

        // Vérifier l’en-tête Authorization
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                userId = jwtUtil.extractUserId(token);
            } catch (Exception e) {
                System.out.println("🔴 Erreur lors de l'extraction de l'utilisateur depuis l'en-tête: " + e.getMessage());
            }
        }

        // Si pas d’en-tête, vérifier le paramètre token dans l’URL pour WebSocket
        if (token == null && request.getRequestURI().startsWith("/chat")) {
            String query = request.getQueryString();
            if (query != null && query.startsWith("token=")) {
                token = query.substring(6);
                try {
                    userId = jwtUtil.extractUserId(token);
                } catch (Exception e) {
                    System.out.println("🔴 Erreur lors de l'extraction de l'utilisateur depuis l’URL: " + e.getMessage());
                }
            }
        }

        // Authentifier si un userId est extrait
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("🔹 Extraction de l'ID utilisateur depuis le token : " + userId);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userId);
            if (jwtUtil.validateToken(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("✅ Authentification réussie pour l'utilisateur ID : " + userId);
            } else {
                System.out.println("🚨 JWT invalide pour l'utilisateur ID : " + userId);
            }
        }

        chain.doFilter(request, response);
    }
}