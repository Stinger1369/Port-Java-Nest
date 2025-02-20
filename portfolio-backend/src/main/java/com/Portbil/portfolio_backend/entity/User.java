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
    private String resetToken; // ✅ Token pour réinitialisation du mot de passe
    private LocalDateTime resetTokenExpiration; // ✅ Expiration du token (ajouté)

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

    // ✅ Liste des anciens mots de passe hachés (évite la réutilisation des anciens mots de passe)
    @Builder.Default
    private List<String> previousPasswords = new ArrayList<>();

    private boolean isVerified;
    private String confirmationCode;

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
