package com.Portbil.portfolio_backend.security;

import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        System.out.println("🔹 Recherche de l'utilisateur dans CustomUserDetailsService : " + identifier);

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            // 🔍 Essayer de trouver l'utilisateur par ID si l'email n'a pas été trouvé
            userOpt = userRepository.findById(identifier);
        }

        User user = userOpt.orElseThrow(() -> {
            System.out.println("❌ Utilisateur non trouvé : " + identifier);
            return new UsernameNotFoundException("Utilisateur non trouvé avec l'identifiant : " + identifier);
        });

        System.out.println("✅ Utilisateur trouvé : " + user.getEmail() + " | ID: " + user.getId());

        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.name()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getId())  // ✅ Stocke **l'ID** dans le Security Context
                .password(user.getPassword())
                .authorities(authorities)
                .build();
    }
}
