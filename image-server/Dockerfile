# Utiliser une image Go comme base
FROM golang:1.23-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers go.mod et go.sum
COPY go.mod go.sum ./

# Télécharger les dépendances
RUN go mod download

# Copier tout le code source
COPY . .

# Construire l'application
RUN go build -o image-server main.go

# Utiliser une image alpine légère pour exécuter l'application
FROM alpine:3.19

# Définir le répertoire de travail
WORKDIR /app

# Copier l'exécutable depuis la phase de build
COPY --from=build /app/image-server .

# Copier les répertoires public et models pour les fichiers statiques et les modèles
COPY --from=build /app/public /app/public
COPY --from=build /app/models /app/models

# Exposer le port 7000 (correspondant à SERVER_PORT dans env.go ou main.go)
EXPOSE 7000

# Commande pour lancer l'application
CMD ["./image-server"]