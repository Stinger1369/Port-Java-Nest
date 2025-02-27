package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.ImageDTO;
import com.Portbil.portfolio_backend.exception.GoApiException;
import com.Portbil.portfolio_backend.model.ErrorResponse;
import com.Portbil.portfolio_backend.service.ImageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
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

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadImage(
            @RequestParam("userId") String userId,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file) {
        try {
            System.out.println("🔹 Début de l'upload d'image pour userId: " + userId + ", name: " + name);

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

            String goApiUrl = "http://localhost:7000/server-image/ajouter-image";
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

                ImageDTO imageDTO = imageService.uploadImage(userId, name, file, imageUrl, isNSFW);
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
            String goApiUrl = "http://localhost:7000/server-image/image/" + userId + "/";
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                List<ImageDTO> images = imageService.getUserImages(userId);
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
    public ResponseEntity<Void> deleteImage(@PathVariable String userId, @PathVariable String name) {
        try {
            String goApiUrl = "http://localhost:7000/server-image/delete-image/" + userId + "/" + name;
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                // Appeler ImageService pour supprimer l'image dans MongoDB et mettre à jour l'utilisateur
                imageService.deleteImage(userId, name);
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

    // Endpoint pour récupérer une image spécifique
    @GetMapping("/{userId}/{name}")
    public ResponseEntity<ImageDTO> getImage(
            @PathVariable String userId,
            @PathVariable String name) {
        try {
            String goApiUrl = "http://localhost:7000/server-image/image/" + userId + "/" + name;
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

    // Nouveau endpoint pour récupérer toutes les images d'un utilisateur spécifique
    @GetMapping("/all/{userId}")
    public ResponseEntity<List<ImageDTO>> getAllImagesByUserId(@PathVariable String userId) {
        try {
            String goApiUrl = "http://localhost:7000/server-image/all-images/" + userId;
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                List<ImageDTO> images = objectMapper.readValue(
                        goResponse.getBody(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, ImageDTO.class)
                );
                // Garantir que images n'est jamais null
                List<ImageDTO> result = (images != null) ? images : Collections.emptyList();
                System.out.println("✅ Toutes les images récupérées avec succès pour userId: " + userId + " - " + result);
                return ResponseEntity.ok(result);
            } else {
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (JsonProcessingException e) {
            System.out.println("❌ Erreur lors du parsing des images: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList()); // Retourne [] en cas d'erreur de parsing
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération de toutes les images: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList()); // Retourne [] en cas d'erreur générale
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