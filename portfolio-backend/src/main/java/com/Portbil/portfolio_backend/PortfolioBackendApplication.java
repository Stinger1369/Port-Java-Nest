package com.Portbil.portfolio_backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PortfolioBackendApplication {

	public static void main(String[] args) {
		// Charger le fichier .env
		Dotenv dotenv = Dotenv.configure()
				.directory("./") // Chemin vers le fichier .env (racine du projet)
				.ignoreIfMissing() // Ignorer si le fichier .env est absent
				.load();

		// Injecter les variables d'environnement dans les propriétés système
		if (dotenv != null) {
			dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
			System.out.println("✅ Variables d'environnement chargées depuis .env");
		} else {
			System.out.println("⚠️ Fichier .env non trouvé ou non chargé.");
		}

		// Démarrer l'application Spring Boot
		SpringApplication.run(PortfolioBackendApplication.class, args);
	}
}