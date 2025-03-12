package com.Portbil.portfolio_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

@Configuration
public class MessageConfig {

    @Bean
    public ResourceBundleMessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages"); // Préfixe des fichiers (messages_fr, messages_ar, etc.)
        source.setDefaultEncoding("UTF-8");
        source.setFallbackToSystemLocale(false); // Ne pas fallback sur la locale système
        return source;
    }
}