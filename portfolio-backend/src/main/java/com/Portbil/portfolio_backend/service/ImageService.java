package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.ImageDTO;
import com.Portbil.portfolio_backend.entity.Image;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ImageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final UserService userService;
    private static final String IMAGE_SERVER_URL = "http://localhost:7000/server-image";

    /**
     * Upload d'une image unique
     */
    public ImageDTO uploadImage(String userId, String name, MultipartFile file, String imageUrl, boolean isNSFW) {
        try {
            System.out.println("🔹 Début de l'upload d'image pour userId: " + userId + ", name: " + name);
            // Enregistrer les métadonnées dans MongoDB
            Image image = Image.builder()
                    .userId(userId)
                    .name(name)
                    .path(imageUrl.replace("http://localhost:7000/", ""))
                    .isNSFW(isNSFW)
                    .isProfilePicture(true)
                    .uploadedAt(LocalDateTime.now())
                    .build();

            Image savedImage = imageRepository.save(image);

            // Associer l'image à l'utilisateur directement via UserRepository
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
            if (user.getImageIds() == null) {
                user.setImageIds(new ArrayList<>());
            }
            user.getImageIds().add(savedImage.getId());

            // Vérifier s'il y a déjà une photo de profil et la mettre à jour si nécessaire
            if (user.getImageIds().size() == 1 || !user.getImageIds().stream()
                    .map(imageRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .anyMatch(img -> img.isProfilePicture())) {
                savedImage.setIsProfilePicture(true); // Utiliser savedImage ici, car il a un ID
            } else {
                // Si une autre image est déjà marquée comme profil, désactiver l'ancienne
                user.getImageIds().stream()
                        .map(imageRepository::findById)
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .filter(img -> img.isProfilePicture())
                        .forEach(img -> {
                            img.setIsProfilePicture(false);
                            imageRepository.save(img);
                        });
                savedImage.setIsProfilePicture(true); // Utiliser savedImage ici
            }

            // Mettre à jour profilePictureUrl dans User si tu veux stocker l'URL directement
            userService.updateProfilePictureUrl(userId, "http://localhost:7000/" + savedImage.getPath());

            userRepository.save(user);

            System.out.println("✅ Image uploadée avec succès: " + savedImage);
            return mapToDTO(savedImage);
        } catch (Exception e) {
            System.out.println("❌ Erreur inattendue lors de l'upload: " + e.getMessage() + ", Stacktrace: " + e.getStackTrace());
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer les images d'un utilisateur
     */
    public List<ImageDTO> getUserImages(String userId) {
        List<Image> images = imageRepository.findByUserId(userId);
        return images.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    /**
     * Supprimer une image
     */
    public void deleteImage(String userId, String name) {
        try {
            System.out.println("🔹 Début de la suppression d'image pour userId: " + userId + ", name: " + name);
            // Préparer la requête pour le serveur Go (sans token JWT, car non requis)
            String goApiUrl = IMAGE_SERVER_URL + "/delete-image/" + userId + "/" + name;
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            System.out.println("🔹 Réponse du serveur Go: Statut = " + response.getStatusCode() + ", Corps = " + response.getBody());
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new HttpClientErrorException(response.getStatusCode(), "Failed to delete image: " + response.getBody());
            }

            // Supprimer l'image de MongoDB
            // Trouver l'image par userId et name manuellement, car findByUserIdAndName n'existe pas
            Image deletedImage = imageRepository.findByUserId(userId).stream()
                    .filter(img -> img.getName().equals(name))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Image introuvable : " + name));
            imageRepository.delete(deletedImage);

            // Mettre à jour l'utilisateur si l'image supprimée était la photo de profil
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
            if (deletedImage.isProfilePicture()) {
                // Trouver une nouvelle image pour devenir la photo de profil (par exemple, la plus récente)
                List<Image> userImages = imageRepository.findByUserId(userId);
                Image newProfileImage = null; // Déclarer la variable ici pour garantir la portée
                if (!userImages.isEmpty()) {
                    newProfileImage = userImages.stream()
                            .filter(img -> !img.getId().equals(deletedImage.getId()))
                            .max((img1, img2) -> img1.getUploadedAt().compareTo(img2.getUploadedAt()))
                            .orElse(null);
                    if (newProfileImage != null) {
                        newProfileImage.setIsProfilePicture(true);
                        imageRepository.save(newProfileImage);
                    }
                }

                // Mettre à jour profilePictureUrl dans User si nécessaire (optionnel)
                String newProfilePictureUrl = newProfileImage != null ? "http://localhost:7000/" + newProfileImage.getPath() : null;
                userService.updateProfilePictureUrl(userId, newProfilePictureUrl);
            }

            userRepository.save(user);
            System.out.println("✅ Image supprimée avec succès");
        } catch (HttpClientErrorException e) {
            System.out.println("❌ Erreur HTTP Client lors de la suppression: Statut = " + e.getStatusCode() + ", Réponse = " + e.getResponseBodyAsString());
            throw new RuntimeException("Failed to delete image from Go server: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            System.out.println("❌ Erreur inattendue lors de la suppression: " + e.getMessage() + ", Stacktrace: " + e.getStackTrace());
            throw new RuntimeException("Failed to delete image: " + e.getMessage(), e);
        }
    }

    /**
     * Extraire l'URL de l'image depuis la réponse JSON du serveur Go
     */
    private String extractImageUrl(String responseBody) {
        int linkStart = responseBody.indexOf("\"link\":\"") + 8;
        int linkEnd = responseBody.indexOf("\"", linkStart);
        return responseBody.substring(linkStart, linkEnd);
    }

    /**
     * Vérifier NSFW dans la réponse (si le serveur Go renvoie cette info)
     */
    private boolean checkNSFWFromResponse(String responseBody) {
        return false; // Le serveur Go supprime déjà les images NSFW
    }

    /**
     * Mapper une entité Image vers un DTO
     */
    private ImageDTO mapToDTO(Image image) {
        return ImageDTO.builder()
                .id(image.getId())
                .userId(image.getUserId())
                .name(image.getName())
                .path(image.getPath())
                .isNSFW(image.isNSFW())
                .uploadedAt(image.getUploadedAt().toString()) // Convertir LocalDateTime en String (ISO 8601)
                .build();
    }

    // Méthode helper pour créer un formulaire multipart/form-data avec un fichier réel
    private HttpEntity<?> createMultipartFormData(String userId, String name, MultipartFile file) throws IOException {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_id", userId);
        body.add("name", name);

        // Sauvegarder temporairement le MultipartFile dans un fichier local
        File tempFile = File.createTempFile("upload_", ".tmp");
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }
        body.add("file", new FileSystemResource(tempFile));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        return new HttpEntity<>(body, headers);
    }
}