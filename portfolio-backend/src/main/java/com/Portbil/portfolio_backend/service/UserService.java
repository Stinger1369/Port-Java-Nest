package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Récupérer tous les utilisateurs
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    /**
     * Mettre à jour les informations d'un utilisateur
     */
    public Optional<User> updateUser(String id, UserDTO userDTO) {
        return userRepository.findById(id).map(user -> {
            // Vérifier si l'email est déjà utilisé par un autre utilisateur
            if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
                Optional<User> existingUser = userRepository.findByEmail(userDTO.getEmail());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                    throw new IllegalArgumentException("Cet email est déjà utilisé par un autre compte.");
                }
                user.setEmail(userDTO.getEmail());
            }

            // Vérifier si le mot de passe est fourni et l'encoder
            if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }

            // Mettre à jour les autres champs facultatifs
            if (userDTO.getFirstName() != null) user.setFirstName(userDTO.getFirstName());
            if (userDTO.getLastName() != null) user.setLastName(userDTO.getLastName());
            if (userDTO.getPhone() != null) user.setPhone(userDTO.getPhone());
            if (userDTO.getAddress() != null) user.setAddress(userDTO.getAddress());
            if (userDTO.getCity() != null) user.setCity(userDTO.getCity());
            if (userDTO.getCountry() != null) user.setCountry(userDTO.getCountry());
            if (userDTO.getGender() != null) user.setGender(userDTO.getGender());
            if (userDTO.getBio() != null) user.setBio(userDTO.getBio());

            return userRepository.save(user);
        });
    }

    /**
     * Supprimer un utilisateur
     */
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    /**
     * Récupérer un utilisateur par email
     */
    public Optional<User> getUserByEmail(String email) {
        System.out.println("🔍 Vérification UserRepository.findByEmail : " + email);
        Optional<User> user = userRepository.findByEmail(email);

        if (user.isEmpty()) {
            System.out.println("❌ Aucun utilisateur trouvé en base avec cet email : " + email);
        } else {
            System.out.println("✅ Utilisateur trouvé en base : " + user.get().getEmail());
        }

        return user;
    }

    /**
     * Inscription avec génération d'un code de validation par email
     */
    public User registerUser(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }

        String confirmationCode = generateConfirmationCode();

        User newUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .isVerified(false)
                .confirmationCode(confirmationCode)
                .previousPasswords(new ArrayList<>())
                .build();

        userRepository.save(newUser);

        emailService.sendEmail(email, "Confirmation de votre compte",
                "Bonjour,\n\nVotre code de validation est : " + confirmationCode +
                        "\n\nMerci de confirmer votre compte.");

        return newUser;
    }

    /**
     * Vérification du compte utilisateur avec le code reçu par email
     */
    public boolean verifyUser(String email, String code) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur introuvable.");
        }

        User user = userOpt.get();

        if (user.getConfirmationCode() == null || !user.getConfirmationCode().equals(code)) {
            throw new IllegalArgumentException("Code de confirmation invalide.");
        }

        user.setVerified(true);
        user.setConfirmationCode(null);
        userRepository.save(user);
        return true;
    }

    /**
     * Vérification du mot de passe avec hashage
     */
    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    /**
     * Demande de réinitialisation du mot de passe (génère un token et envoie un email)
     */
    public void forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Aucun utilisateur trouvé avec cet email.");
        }

        User user = userOpt.get();
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(15);

        user.setResetToken(resetToken);
        user.setResetTokenExpiration(expirationTime);
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;

        emailService.sendEmail(email, "Réinitialisation de votre mot de passe",
                "Cliquez sur le lien suivant pour réinitialiser votre mot de passe (valide pendant 15 minutes) :\n\n" + resetLink);
    }

    /**
     * Réinitialisation du mot de passe avec expiration et vérification des anciens mots de passe
     */
    public void resetPassword(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Token invalide pour la réinitialisation.");
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiration() == null || user.getResetTokenExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.");
        }

        if (user.getPreviousPasswords() == null) {
            user.setPreviousPasswords(new ArrayList<>());
        }

        for (String oldPassword : user.getPreviousPasswords()) {
            if (passwordEncoder.matches(newPassword, oldPassword)) {
                throw new IllegalArgumentException("⚠️ Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.");
            }
        }

        user.getPreviousPasswords().add(user.getPassword());

        if (user.getPreviousPasswords().size() > 5) {
            user.getPreviousPasswords().remove(0);
        }

        user.setPassword(passwordEncoder.encode(newPassword));

        user.setResetToken(null);
        user.setResetTokenExpiration(null);
        user.setVerified(true);
        userRepository.save(user);
    }

    /**
     * Génère un code de confirmation à 6 chiffres
     */
    private String generateConfirmationCode() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }
}