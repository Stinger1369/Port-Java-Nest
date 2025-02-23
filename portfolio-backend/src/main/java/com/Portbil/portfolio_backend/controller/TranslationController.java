package com.Portbil.portfolio_backend.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/translations")
public class TranslationController {

    @GetMapping(value = "/{lang}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getTranslations(@PathVariable String lang) {
        try {
            String filePath = "locales/" + lang + ".json";
            ClassPathResource resource = new ClassPathResource(filePath);
            if (!resource.exists()) {
                return ResponseEntity.status(404).body("{\"error\": \"Language not found: " + lang + "\"}");
            }
            String content = new String(Files.readAllBytes(resource.getFile().toPath()));
            return ResponseEntity.ok(content);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("{\"error\": \"Failed to load translations\"}");
        }
    }
}