package com.Portbil.portfolio_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final String FROM_EMAIL = "renvarchits@lolaparfums.com"; // ✅ Expéditeur autorisé par Ionos, en majuscules pour constante

    /**
     * Envoie un email HTML avec logs détaillés
     *
     * @param to          Destinataire de l'email
     * @param subject     Sujet de l'email
     * @param htmlContent Contenu HTML de l'email
     * @throws RuntimeException si l'envoi échoue
     */
    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            System.out.println("📨 Tentative d'envoi d'email à : " + to + " | Sujet : " + subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL); // ✅ Expéditeur fixe pour Ionos
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // ✅ Mode HTML activé

            System.out.println("🛠️ Configuration de l'email terminée, envoi en cours...");
            mailSender.send(message);
            System.out.println("✅ Email envoyé avec succès à " + to + " | Sujet : " + subject);
        } catch (MessagingException e) {
            System.err.println("❌ Échec de l'envoi de l'email à : " + to + " | Raison : " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("❌ Échec de l'envoi de l'email à " + to, e);
        }
    }
}