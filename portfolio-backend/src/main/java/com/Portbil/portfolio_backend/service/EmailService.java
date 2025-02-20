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
    private final String fromEmail = "renvarchits@lolaparfums.com"; // ✅ Définir l'expéditeur autorisé par Ionos

    /**
     * Envoie un email HTML avec logs détaillés
     *
     * @param to Destinataire
     * @param subject Sujet
     * @param htmlContent Contenu HTML de l'email
     */
    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            System.out.println("📨 Tentative d'envoi d'email...");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail); // ✅ Obligatoire pour éviter l'erreur 550
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // ✅ Activer le mode HTML

            System.out.println("🛠️ Configuration de l'email terminée, envoi en cours...");
            mailSender.send(message);
            System.out.println("✅ Email envoyé avec succès à " + to);
        } catch (MessagingException e) {
            System.err.println("❌ Échec de l'envoi de l'email !");
            e.printStackTrace();
            throw new RuntimeException("❌ Échec de l'envoi de l'email", e);
        }
    }
}
