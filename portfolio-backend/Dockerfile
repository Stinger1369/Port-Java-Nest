# Stage de build avec Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests
# Étape de débogage : vérifier si le JAR est généré
RUN ls -l /app/target/

# Stage runtime avec JDK complet
FROM openjdk:21-jdk
WORKDIR /app
COPY --from=build /app/target/portfolio-backend-0.0.1-SNAPSHOT.jar app.jar
RUN chmod 644 /app/app.jar
RUN ls -l /app/
RUN whoami
# Vérifier la version de Java
RUN java -version
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]