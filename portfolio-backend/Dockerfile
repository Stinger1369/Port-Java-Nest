# Utiliser une image Java 17 (ou 21 si nécessaire) comme base
FROM openjdk:17-jdk-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier JAR généré (target/portfolio-backend-0.0.1-SNAPSHOT.jar)
COPY target/portfolio-backend-0.0.1-SNAPSHOT.jar app.jar

# Exposer le port 8080 (correspondant à server.port dans application.yml)
EXPOSE 8080

# Commande pour lancer l'application
CMD ["java", "-jar", "app.jar"]