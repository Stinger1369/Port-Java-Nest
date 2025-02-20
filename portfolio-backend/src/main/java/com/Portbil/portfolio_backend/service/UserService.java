package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * ✅ Inscription avec génération d'un code de validation par email
     */
    public User registerUser(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        // ✅ Génération d'un code de confirmation aléatoire
        String confirmationCode = generateConfirmationCode();

        User newUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password)) // Mot de passe sécurisé
                .isVerified(false) // L'utilisateur doit valider son email
                .confirmationCode(confirmationCode)
                .build();

        userRepository.save(newUser);

        // ✅ Envoi de l'email de validation
        emailService.sendEmail(email, "Confirmation de votre compte",
                "Bonjour,\n\nVotre code de validation est : " + confirmationCode +
                        "\n\nMerci de confirmer votre compte.");

        return newUser;
    }

    /**
     * ✅ Vérification du compte utilisateur avec le code reçu par email
     */
    public boolean verifyUser(String email, String code) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getConfirmationCode().equals(code)) {
            User user = userOpt.get();
            user.setVerified(true);
            user.setConfirmationCode(null); // ✅ Supprime le code après validation
            userRepository.save(user);
            return true;
        }
        return false;
    }

    /**
     * ✅ Vérifie si le mot de passe brut correspond au mot de passe haché
     */
    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    /**
     * ✅ Récupérer un utilisateur par email
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * ✅ Récupérer tous les utilisateurs
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * ✅ Récupérer un utilisateur par ID
     */
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    /**
     * ✅ Mettre à jour un utilisateur
     */
    public Optional<User> updateUser(String id, UserDTO userDTO) {
        return userRepository.findById(id).map(existingUser -> {
            existingUser.setFirstName(userDTO.getFirstName());
            existingUser.setLastName(userDTO.getLastName());
            existingUser.setPhone(userDTO.getPhone());
            existingUser.setAddress(userDTO.getAddress());
            existingUser.setCity(userDTO.getCity());
            existingUser.setCountry(userDTO.getCountry());
            existingUser.setGender(userDTO.getGender());
            existingUser.setBio(userDTO.getBio());

            return userRepository.save(existingUser);
        });
    }

    /**
     * ✅ Supprimer un utilisateur
     */
    public void deleteUser(String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("User with ID " + id + " not found.");
        }
    }

    /**
     * ✅ Demande de réinitialisation du mot de passe (génère un token et envoie un email)
     */
    public void forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("No user found with this email.");
        }

        User user = userOpt.get();
        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        userRepository.save(user);

        // ✅ Création du lien de réinitialisation
        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken; // Lien pour le frontend
        emailService.sendEmail(email, "Réinitialisation de votre mot de passe",
                "Cliquez sur le lien suivant pour réinitialiser votre mot de passe :\n\n" + resetLink);
    }

    /**
     * ✅ Réinitialisation du mot de passe avec le token
     */
    public void resetPassword(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid reset token.");
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword)); // ✅ Hash correct
        user.setResetToken(null); // ✅ Supprime le token après réinitialisation
        user.setVerified(true); // ✅ Activation de l'utilisateur après reset
        userRepository.save(user);
    }

    /**
     * ✅ Génère un code de confirmation à 6 chiffres
     */
    private String generateConfirmationCode() {
        return String.valueOf(100000 + new Random().nextInt(900000)); // Code 6 chiffres
    }
}
