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
}