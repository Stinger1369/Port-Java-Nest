package com.Portbil.portfolio_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
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

    // Champ `sex` avec options limitées
    private String sex;

    // Champ `slug` avec contrainte d'unicité
    @Indexed(unique = true)
    private String slug;

    private String profilePictureUrl;
    private Set<String> interests;
    private String bio;

    @Builder.Default
    private Set<Role> roles = Collections.singleton(Role.USER);

    @Builder.Default
    private List<String> previousPasswords = new ArrayList<>();

    private boolean isVerified;
    private String confirmationCode;

    // Nouveaux champs pour la limitation de débit
    private LocalDateTime lastVerificationCodeRequest; // Dernière demande de code
    @Builder.Default
    private int verificationCodeRequestCount = 0; // Nombre de demandes dans la période

    // Liste des IDs des éléments du portfolio
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

    // Référence vers le portfolio personnalisé de l'utilisateur
    private String portfolioId;

    // Champs pour la géolocalisation
    private Double latitude;
    private Double longitude;

    // Liste des IDs des contacts acceptés
    @Builder.Default
    private List<String> contactIds = new ArrayList<>();

    // Liste des IDs des images associées à l'utilisateur
    @Builder.Default
    private List<String> imageIds = new ArrayList<>();

    // Liste des IDs des utilisateurs likés et qui ont liké cet utilisateur
    @Builder.Default
    private List<String> likedUserIds = new ArrayList<>();
    @Builder.Default
    private List<String> likerUserIds = new ArrayList<>();

    // Nouveau champ pour les conversations (chatIds)
    @Builder.Default
    private List<String> chatIds = new ArrayList<>();

    // Nouveaux champs pour gérer les relations d'amitié
    @Builder.Default
    private List<String> friendIds = new ArrayList<>(); // Liste des amis acceptés

    @Builder.Default
    private List<String> friendRequestSentIds = new ArrayList<>(); // Demandes d'amis envoyées

    @Builder.Default
    private List<String> friendRequestReceivedIds = new ArrayList<>(); // Demandes d'amis reçues

    // Méthode pour récupérer toutes les IDs des sections du portfolio
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

    // Champ pour contrôler l'affichage de la date de naissance
    @Builder.Default
    private boolean showBirthdate = false;

    // Méthode pour calculer l'âge
    public Integer getAge() {
        if (birthdate == null) return null;
        return Period.between(birthdate, LocalDate.now()).getYears();
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