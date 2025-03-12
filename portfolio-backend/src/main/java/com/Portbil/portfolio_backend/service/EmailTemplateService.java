package com.Portbil.portfolio_backend.service;

import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
public class EmailTemplateService {

    private final SpringTemplateEngine templateEngine;

    public EmailTemplateService(SpringTemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /**
     * Génère le contenu HTML pour une demande de contact en utilisant Thymeleaf
     */
    public String generateContactRequestEmail(
            String receiverName,
            String senderName,
            String senderEmail,
            String senderPhone,
            String portfolioLink
    ) {
        Context context = new Context();
        context.setVariable("receiverName", receiverName);
        context.setVariable("senderName", senderName);
        context.setVariable("senderEmail", senderEmail);
        context.setVariable("senderPhone", senderPhone);
        context.setVariable("portfolioLink", portfolioLink);

        return templateEngine.process("contact-request-email", context);
    }

    /**
     * Génère le contenu HTML pour l'email de vérification de compte
     */
    public String generateVerificationEmail(
            String userName,
            String verificationCode,
            String slug,
            String verificationLink
    ) {
        Context context = new Context();
        context.setVariable("userName", userName != null ? userName : "Utilisateur");
        context.setVariable("verificationCode", verificationCode);
        context.setVariable("slug", slug);
        context.setVariable("verificationLink", verificationLink);

        return templateEngine.process("verify-account-email", context);
    }

    /**
     * Génère le contenu HTML pour l'email de réinitialisation de mot de passe
     */
    public String generateResetPasswordEmail(
            String userName,
            String resetLink
    ) {
        Context context = new Context();
        context.setVariable("userName", userName != null ? userName : "Utilisateur");
        context.setVariable("resetLink", resetLink);

        return templateEngine.process("reset-password-email", context);
    }
}