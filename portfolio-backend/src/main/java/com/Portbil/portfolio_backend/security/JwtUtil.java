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

    @Value("${jwt.expirationMs}")
    private long expirationMs; // Récupère la valeur depuis application.yml

    private static final long CLOCK_SKEW = 1000 * 60 * 5; // 5 minutes de tolérance

    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secret)
                    .setAllowedClockSkewSeconds(CLOCK_SKEW / 1000) // Tolérance de 5 minutes
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            System.out.println("🔴 Erreur lors de l'extraction des claims: " + e.getMessage());
            throw e;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        boolean expired = expiration.before(new Date());
        if (expired) {
            System.out.println("🔴 Token expiré - Expiration: " + expiration + ", Heure actuelle: " + new Date());
        }
        return expired;
    }

    public String generateToken(UserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs); // Utilise expirationMs
        String token = Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
        System.out.println("✅ Token généré - Issued at: " + now + ", Expires at: " + expiryDate);
        return token;
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String userId = extractUserId(token);
        boolean isValid = userId.equals(userDetails.getUsername()) && !isTokenExpired(token);
        System.out.println("🔍 Validation du token - UserId: " + userId + ", Valid: " + isValid);
        return isValid;
    }
}