package com.Portbil.portfolio_backend.service.user;

import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.EmailService;
import com.Portbil.portfolio_backend.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final MessageSource messageSource;

    /**
     * Inscription avec génération d'un code de validation par email et slug unique
     */
    public User registerUser(String email, String password, Locale locale) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException(messageSource.getMessage("email.already.used", null, locale));
        }

        String confirmationCode = generateConfirmationCode();
        String slug = generateUniqueSlug(email.split("@")[0], null);

        User newUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .isVerified(false)
                .confirmationCode(confirmationCode)
                .slug(slug)
                .previousPasswords(new ArrayList<>())
                .build();

        userRepository.save(newUser);

        String htmlContent = emailTemplateService.generateVerificationEmail(
                null, confirmationCode, slug, "http://localhost:5173/verify-account?email=" + email
        );

        emailService.sendEmail(email, "Confirmation de votre compte", htmlContent);
        return newUser;
    }

    /**
     * Vérification du compte utilisateur avec le code reçu par email
     */
    public boolean verifyUser(String email, String code, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{email}, locale));
        }

        User user = userOpt.get();

        if (user.getConfirmationCode() == null || !user.getConfirmationCode().equals(code)) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.code", null, locale));
        }

        user.setVerified(true);
        user.setConfirmationCode(null);
        userRepository.save(user);
        return true;
    }

    /**
     * Renvoyer un nouveau code de vérification avec limitation
     */
    public void resendVerificationCode(String email, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{email}, locale));
        }

        User user = userOpt.get();
        if (user.isVerified()) {
            throw new IllegalArgumentException(messageSource.getMessage("account.already.verified", null, locale));
        }

        LocalDateTime now = LocalDateTime.now();
        long minutesSinceLastRequest = user.getLastVerificationCodeRequest() != null
                ? ChronoUnit.MINUTES.between(user.getLastVerificationCodeRequest(), now)
                : Long.MAX_VALUE;

        if (minutesSinceLastRequest > 15) { // Changement de 60 à 15 minutes
            user.setVerificationCodeRequestCount(0);
        }

        if (user.getVerificationCodeRequestCount() >= 5) {
            throw new IllegalArgumentException(
                    messageSource.getMessage("too.many.requests.code", new Object[]{15 - minutesSinceLastRequest}, locale)
            );
        }

        String newConfirmationCode = generateConfirmationCode();
        user.setConfirmationCode(newConfirmationCode);
        user.setLastVerificationCodeRequest(now);
        user.setVerificationCodeRequestCount(user.getVerificationCodeRequestCount() + 1);
        userRepository.save(user);

        String htmlContent = emailTemplateService.generateVerificationEmail(
                user.getFirstName(), newConfirmationCode, user.getSlug(),
                "http://localhost:5173/verify-account?email=" + email
        );

        emailService.sendEmail(email, "Nouveau code de vérification", htmlContent);
        System.out.println("✅ Nouveau code de vérification envoyé à " + email + " : " + newConfirmationCode);
    }

    /**
     * Vérification du mot de passe avec hashage
     */
    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    /**
     * Demande de réinitialisation du mot de passe
     */
    public void forgotPassword(String email, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{email}, locale));
        }

        User user = userOpt.get();
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(15);

        user.setResetToken(resetToken);
        user.setResetTokenExpiration(expirationTime);
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;

        String htmlContent = emailTemplateService.generateResetPasswordEmail(user.getFirstName(), resetLink);
        emailService.sendEmail(email, "Réinitialisation de votre mot de passe", htmlContent);
    }

    /**
     * Réinitialisation du mot de passe
     */
    public void resetPassword(String token, String newPassword, Locale locale) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.token", null, locale));
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiration() == null || user.getResetTokenExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(messageSource.getMessage("expired.reset.link", null, locale));
        }

        if (user.getPreviousPasswords() == null) {
            user.setPreviousPasswords(new ArrayList<>());
        }

        for (String oldPassword : user.getPreviousPasswords()) {
            if (passwordEncoder.matches(newPassword, oldPassword)) {
                throw new IllegalArgumentException(messageSource.getMessage("password.previously.used", null, locale));
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
     * Générer un code de confirmation à 6 chiffres
     */
    private String generateConfirmationCode() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    /**
     * Générer un slug unique basé sur une base donnée (email ou slug personnalisé)
     */
    private String generateUniqueSlug(String baseSlug, String userId) {
        String slug = baseSlug.toLowerCase().replaceAll("[^a-z0-9]", "-");
        String uniqueSlug = slug;
        int counter = 1;

        while (userRepository.findBySlug(uniqueSlug).isPresent() &&
                (userId == null || !userRepository.findBySlug(uniqueSlug).get().getId().equals(userId))) {
            uniqueSlug = slug + "-" + counter++;
        }
        return uniqueSlug;
    }
}