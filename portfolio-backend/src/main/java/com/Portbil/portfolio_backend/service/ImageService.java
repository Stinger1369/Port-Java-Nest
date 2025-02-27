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
            // Utiliser le nom complet tiré de l'URL renvoyée par Go
            String fullName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1); // Extrait le nom avec UUID

            // Enregistrer les métadonnées dans MongoDB
            Image image = Image.builder()
                    .userId(userId)
                    .name(fullName) // Utiliser fullName au lieu de name
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
                savedImage.setIsProfilePicture(true);
            } else {
                user.getImageIds().stream()
                        .map(imageRepository::findById)
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .filter(img -> img.isProfilePicture())
                        .forEach(img -> {
                            img.setIsProfilePicture(false);
                            imageRepository.save(img);
                        });
                savedImage.setIsProfilePicture(true);
            }

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
     * Supprimer une image dans MongoDB et mettre à jour l'utilisateur
     */
    public void deleteImage(String userId, String name) {
        try {
            System.out.println("🔹 Début de la suppression d'image dans MongoDB pour userId: " + userId + ", name: " + name);

            // 1. Trouver et supprimer l'image dans MongoDB
            Optional<Image> imageOpt = imageRepository.findByUserIdAndName(userId, name);
            if (imageOpt.isEmpty()) {
                System.out.println("⚠️ Image non trouvée dans MongoDB pour userId: " + userId + ", name: " + name);
                throw new IllegalArgumentException("Image introuvable dans la base de données: " + name);
            }
            Image deletedImage = imageOpt.get();
            imageRepository.delete(deletedImage);
            System.out.println("✅ Image supprimée de MongoDB : " + deletedImage.getId());

            // 2. Mettre à jour l'utilisateur
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
            boolean removed = user.getImageIds().remove(deletedImage.getId());
            if (!removed) {
                System.out.println("⚠️ L'image " + deletedImage.getId() + " n'était pas dans la liste imageIds de l'utilisateur");
            }

            // 3. Gérer la photo de profil si elle est supprimée
            if (deletedImage.isProfilePicture()) {
                List<Image> remainingImages = imageRepository.findByUserId(userId);
                Image newProfileImage = null;
                if (!remainingImages.isEmpty()) {
                    newProfileImage = remainingImages.stream()
                            .max((img1, img2) -> img1.getUploadedAt().compareTo(img2.getUploadedAt()))
                            .orElse(null);
                    if (newProfileImage != null) {
                        newProfileImage.setIsProfilePicture(true);
                        imageRepository.save(newProfileImage);
                        System.out.println("✅ Nouvelle photo de profil définie : " + newProfileImage.getId());
                    }
                }
                String newProfilePictureUrl = newProfileImage != null ? "http://localhost:7000/" + newProfileImage.getPath() : null;
                userService.updateProfilePictureUrl(userId, newProfilePictureUrl); // Correction ici : utiliser userService
            }

            userRepository.save(user);
            System.out.println("✅ Utilisateur mis à jour avec succès");
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la suppression de l'image: " + e.getMessage());
            throw new RuntimeException("Échec de la suppression de l'image: " + e.getMessage(), e);
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