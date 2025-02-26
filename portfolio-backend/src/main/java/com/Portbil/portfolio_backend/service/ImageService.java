package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.ImageDTO;
import com.Portbil.portfolio_backend.entity.Image;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ImageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap; // Ajouté l'import correct
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private static final String IMAGE_SERVER_URL = "http://localhost:7000/server-image";

    /**
     * Upload d'une image unique
     */
    public ImageDTO uploadImage(String userId, String name, String base64Data) {
        try {
            // Préparer la requête pour le serveur Go
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", "Bearer <ton_token_jwt_ici>"); // Remplace <ton_token_jwt_ici> par un vrai token

            HttpEntity<?> requestEntity = createMultipartFormData(userId, name, base64Data);

            // Appeler le serveur Go
            ResponseEntity<String> response = restTemplate.postForEntity(
                    IMAGE_SERVER_URL + "/ajouter-image",
                    requestEntity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new HttpClientErrorException(response.getStatusCode(), "Failed to upload image: " + response.getBody());
            }

            // Extraire l'URL de l'image depuis la réponse (attendu : {"link": "..."})
            String imageUrl = extractImageUrl(response.getBody());

            // Vérifier NSFW (le serveur Go le fait déjà, mais on peut récupérer le statut si nécessaire)
            boolean isNSFW = checkNSFWFromResponse(response.getBody());

            // Enregistrer les métadonnées dans MongoDB
            Image image = Image.builder()
                    .userId(userId)
                    .name(name)
                    .path(imageUrl.replace("http://localhost:7000/", "")) // Chemin relatif
                    .isNSFW(isNSFW)
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
            userRepository.save(user);

            return mapToDTO(savedImage);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Failed to upload image to Go server: " + e.getResponseBodyAsString(), e);
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
            String goApiUrl = IMAGE_SERVER_URL + "/delete-image/" + userId + "/" + name;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer <ton_token_jwt_ici>"); // Remplace <ton_token_jwt_ici> par un vrai token
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new HttpClientErrorException(response.getStatusCode(), "Failed to delete image: " + response.getBody());
            }

            imageRepository.deleteByUserIdAndName(userId, name);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Failed to delete image from Go server: " + e.getResponseBodyAsString(), e);
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
                .uploadedAt(image.getUploadedAt())
                .build();
    }

    // Méthode helper pour créer un formulaire multipart/form-data
    private HttpEntity<?> createMultipartFormData(String userId, String name, String base64Data) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_id", userId);
        body.add("name", name);
        body.add("file", base64Data); // Envoie les données en base64 comme texte, ajuste selon l'API Go

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        return new HttpEntity<>(body, headers);
    }
}