package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.ImageDTO;
import com.Portbil.portfolio_backend.exception.GoApiException;
import com.Portbil.portfolio_backend.model.ErrorResponse;
import com.Portbil.portfolio_backend.service.ImageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.image.go-api-url}")
    private String goApiUrlBase;

    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadImage(
            @RequestParam("userId") String userId,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isProfilePicture", defaultValue = "false") boolean isProfilePicture,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        try {
            System.out.println("🔹 Début de l'upload d'image pour userId: " + userId + ", name: " + name + ", isProfilePicture: " + isProfilePicture);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("user_id", userId);
            body.add("name", name);

            File tempFile = File.createTempFile("upload_", ".tmp");
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(file.getBytes());
            }
            body.add("file", new FileSystemResource(tempFile));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            String goApiUrl = goApiUrlBase + "/ajouter-image";
            System.out.println("🔹 Envoi de la requête au serveur Go: URL = " + goApiUrl + ", Headers = " + headers);
            ResponseEntity<String> goResponse = restTemplate.postForEntity(
                    goApiUrl,
                    requestEntity,
                    String.class
            );

            System.out.println("🔹 Réponse du serveur Go: Statut = " + goResponse.getStatusCode() + ", Corps = " + goResponse.getBody());
            if (goResponse.getStatusCode().is2xxSuccessful()) {
                String imageUrl = extractImageUrl(goResponse.getBody());
                boolean isNSFW = checkNSFWFromResponse(goResponse.getBody());

                // Passage de la Locale à la méthode uploadImage
                ImageDTO imageDTO = imageService.uploadImage(userId, name, file, imageUrl, isNSFW, isProfilePicture, locale);
                System.out.println("✅ ImageDTO créé et sauvegardé avec succès: " + imageDTO);

                tempFile.delete();
                return new ResponseEntity<>(imageDTO, HttpStatus.CREATED);
            } else {
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                System.out.println("❌ Erreur du serveur Go: " + errorResponse);
                tempFile.delete();
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            System.out.println("❌ Erreur HTTP Client lors de l'upload: Statut = " + e.getStatusCode() + ", Réponse = " + e.getResponseBodyAsString());
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (IOException e) {
            System.out.println("❌ Erreur IO lors de l'upload: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            System.out.println("❌ Erreur inattendue lors de l'upload: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ImageDTO>> getUserImages(@PathVariable String userId) {
        try {
            String goApiUrl = goApiUrlBase + "/image/" + userId + "/";
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                List<ImageDTO> images = imageService.getAllImagesByUserId(userId);
                System.out.println("✅ Images récupérées pour userId: " + userId + " - " + images);
                return ResponseEntity.ok(images);
            } else {
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{userId}/{name}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable String userId,
            @PathVariable String name,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        try {
            String goApiUrl = goApiUrlBase + "/delete-image/" + userId + "/" + name;
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                imageService.deleteImage(userId, name, locale); // Ajout de Locale
                System.out.println("✅ Image supprimée pour userId: " + userId + ", name: " + name);
                return ResponseEntity.noContent().build();
            } else {
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la suppression: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{userId}/{name}")
    public ResponseEntity<ImageDTO> getImage(
            @PathVariable String userId,
            @PathVariable String name) {
        try {
            String goApiUrl = goApiUrlBase + "/image/" + userId + "/" + name;
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.GET,
                    entity,
                    byte[].class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                ImageDTO imageDTO = ImageDTO.builder()
                        .userId(userId)
                        .name(name)
                        .path("/public/images/" + userId + "/" + name)
                        .isNSFW(false)
                        .uploadedAt(LocalDateTime.now().toString())
                        .build();

                System.out.println("✅ Image récupérée avec succès: " + imageDTO);
                return ResponseEntity.ok(imageDTO);
            } else {
                ErrorResponse errorResponse = parseErrorResponse(new String(goResponse.getBody()));
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération de l'image: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/all/{userId}")
    public ResponseEntity<List<ImageDTO>> getAllImagesByUserId(@PathVariable String userId) {
        try {
            System.out.println("🔹 Récupération des images pour userId: " + userId);
            List<ImageDTO> images = imageService.getAllImagesByUserId(userId);
            if (images.isEmpty()) {
                System.out.println("⚠️ Aucune image trouvée pour userId: " + userId);
                return ResponseEntity.ok(Collections.emptyList());
            }
            System.out.println("✅ Toutes les images récupérées pour userId: " + userId + " - " + images);
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @GetMapping("/by-ids")
    public ResponseEntity<List<ImageDTO>> getImagesByIds(
            @RequestParam("imageIds") List<String> imageIds,
            @RequestParam(value = "filterProfile", required = false, defaultValue = "false") boolean filterProfile) {
        try {
            System.out.println("🔹 Récupération des images par IDs: " + imageIds + ", Filtre profil: " + filterProfile);
            List<ImageDTO> images = imageService.getImagesByIds(imageIds, filterProfile);
            if (images.isEmpty()) {
                System.out.println("⚠️ Aucune image trouvée pour les IDs: " + imageIds + " avec filtre: " + filterProfile);
            } else {
                System.out.println("✅ Images récupérées par IDs: " + images);
            }
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images par IDs: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<List<ImageDTO>> getProfileImagesByUserId(@PathVariable String userId) {
        try {
            System.out.println("🔹 Récupération des images de profil pour userId: " + userId);
            List<ImageDTO> profileImages = imageService.getProfileImagesByUserId(userId);
            if (profileImages.isEmpty()) {
                System.out.println("⚠️ Aucune image de profil trouvée pour userId: " + userId);
                return ResponseEntity.ok(Collections.emptyList());
            }
            System.out.println("✅ Images de profil récupérées pour userId: " + userId + " - " + profileImages);
            return ResponseEntity.ok(profileImages);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images de profil: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @PutMapping("/set-profile-picture/{imageId}")
    public ResponseEntity<ImageDTO> setProfilePicture(
            @PathVariable String imageId,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        try {
            System.out.println("🔹 Tentative de définir l'image " + imageId + " comme photo de profil");
            ImageDTO updatedImage = imageService.setProfilePicture(imageId, locale); // Ajout de Locale
            System.out.println("✅ Image définie comme photo de profil: " + updatedImage);
            return ResponseEntity.ok(updatedImage);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la définition de la photo de profil: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Helpers
    private String extractImageUrl(String responseBody) {
        int linkStart = responseBody.indexOf("\"link\":\"") + 8;
        int linkEnd = responseBody.indexOf("\"", linkStart);
        return responseBody.substring(linkStart, linkEnd);
    }

    private boolean checkNSFWFromResponse(String responseBody) {
        return responseBody.contains("\"isNSFW\":true");
    }

    private ErrorResponse parseErrorResponse(String responseBody) {
        try {
            return objectMapper.readValue(responseBody, ErrorResponse.class);
        } catch (JsonProcessingException e) {
            return new ErrorResponse("ERR999", "Invalid error response from Go API: " + e.getMessage());
        }
    }

    private HttpEntity<?> createMultipartFormData(String userId, String name, MultipartFile file) throws IOException {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_id", userId);
        body.add("name", name);

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