package com.Portbil.portfolio_backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class PortfolioBackendApplication {

	public static void main(String[] args) {
		// Charger le fichier .env
		Dotenv dotenv = Dotenv.configure()
				.directory("./") // Chemin vers le fichier .env (racine du projet)
				.ignoreIfMissing() // Ignorer si le fichier .env est absent
				.load();

		// Injecter les variables d'environnement dans les propriétés système
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		// Démarrer l'application Spring Boot
		SpringApplication.run(PortfolioBackendApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
}