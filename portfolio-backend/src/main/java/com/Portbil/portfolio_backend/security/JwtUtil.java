package com.Portbil.portfolio_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;

    /**
     * ✅ Extrait l'ID utilisateur du token
     */
    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject); // ✅ Retourne **l'ID utilisateur** (pas l'email)
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(secret).build().parseClaimsJws(token).getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * ✅ Génère un JWT contenant **l'ID utilisateur** comme `subject`
     */
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername()) // ✅ Utilise l'ID utilisateur
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 heures
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    /**
     * ✅ Vérifie la validité du token
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        final String userId = extractUserId(token);
        return (userId.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
