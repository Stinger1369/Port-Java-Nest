package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    private String id;
    private String email;
    private String password;
    private String resetToken;
    private LocalDateTime resetTokenExpiration;

    // Champs optionnels
    private String firstName;
    private String lastName;
    private LocalDate birthdate;
    private String profession;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String gender;
    private String profilePictureUrl;
    private Set<String> interests;
    private String bio;

    @Builder.Default
    private Set<Role> roles = Collections.singleton(Role.USER);

    @Builder.Default
    private List<String> previousPasswords = new ArrayList<>();

    private boolean isVerified;
    private String confirmationCode;

    // ✅ Liste des IDs des éléments du portfolio
    @Builder.Default
    private List<String> educationIds = new ArrayList<>();
    @Builder.Default
    private List<String> skillIds = new ArrayList<>();
    @Builder.Default
    private List<String> experienceIds = new ArrayList<>();
    @Builder.Default
    private List<String> projectIds = new ArrayList<>();
    @Builder.Default
    private List<String> certificationIds = new ArrayList<>();
    @Builder.Default
    private List<String> socialLinkIds = new ArrayList<>();
    @Builder.Default
    private List<String> languageIds = new ArrayList<>();
    @Builder.Default
    private List<String> recommendationIds = new ArrayList<>();
    @Builder.Default
    private List<String> interestIds = new ArrayList<>();

    // ✅ Référence vers le portfolio personnalisé de l'utilisateur
    private String portfolioId;

    // ✅ Méthode pour récupérer toutes les IDs des sections du portfolio
    public List<String> getAllPortfolioIds() {
        List<String> allIds = new ArrayList<>();
        allIds.addAll(educationIds);
        allIds.addAll(skillIds);
        allIds.addAll(experienceIds);
        allIds.addAll(projectIds);
        allIds.addAll(certificationIds);
        allIds.addAll(socialLinkIds);
        allIds.addAll(languageIds);
        allIds.addAll(recommendationIds);
        allIds.addAll(interestIds);
        return allIds;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isVerified;
    }
}
