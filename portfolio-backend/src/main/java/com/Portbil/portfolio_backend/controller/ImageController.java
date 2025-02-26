package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.ImageDTO;
import com.Portbil.portfolio_backend.exception.GoApiException;
import com.Portbil.portfolio_backend.model.ErrorResponse;
import com.Portbil.portfolio_backend.service.ImageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
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

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper; // Injecté via @RequiredArgsConstructor

    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadImage(
            @RequestParam("userId") String userId,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file) {
        try {
            // Convertir le fichier en base64
            String base64Data = Base64.getEncoder().encodeToString(file.getBytes());

            // Appeler l'API Go pour uploader l'image
            String goApiUrl = "http://localhost:7000/server-image/ajouter-image";
            HttpEntity<?> requestEntity = createMultipartFormData(userId, name, base64Data);

            // Ajouter l'authentification JWT si nécessaire (exemple avec un token fictif)
            HttpHeaders headers = requestEntity.getHeaders();
            headers.set("Authorization", "Bearer <ton_token_jwt_ici>"); // Remplace <ton_token_jwt_ici> par un vrai token
            requestEntity = new HttpEntity<>(requestEntity.getBody(), headers);

            ResponseEntity<String> goResponse = restTemplate.postForEntity(
                    goApiUrl,
                    requestEntity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                // Parser la réponse Go (par exemple, { "link": "http://..." })
                try {
                    ImageDTO imageDTO = objectMapper.readValue(goResponse.getBody(), ImageDTO.class);
                    return new ResponseEntity<>(imageDTO, HttpStatus.CREATED);
                } catch (JsonProcessingException e) {
                    return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            } else {
                // Si l'API Go renvoie une erreur, parser et lancer une exception
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ImageDTO>> getUserImages(@PathVariable String userId) {
        try {
            // Appeler l'API Go pour lister les images (si disponible, sinon utiliser ImageService)
            String goApiUrl = "http://localhost:7000/server-image/image/" + userId + "/"; // À adapter selon ton API Go
            ResponseEntity<String> goResponse = restTemplate.getForEntity(goApiUrl, String.class);

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                // Parser la réponse Go pour créer une liste d'ImageDTO
                List<ImageDTO> images = imageService.getUserImages(userId); // Utiliser le service existant ou adapter
                return ResponseEntity.ok(images);
            } else {
                // Si l'API Go renvoie une erreur, parser et lancer une exception
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{userId}/{name}")
    public ResponseEntity<Void> deleteImage(@PathVariable String userId, @PathVariable String name) {
        try {
            String goApiUrl = "http://localhost:7000/server-image/delete-image/" + userId + "/" + name;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer <ton_token_jwt_ici>"); // Remplace <ton_token_jwt_ici> par un vrai token
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> goResponse = restTemplate.exchange(
                    goApiUrl,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );

            if (goResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.noContent().build();
            } else {
                ErrorResponse errorResponse = parseErrorResponse(goResponse.getBody());
                throw new GoApiException(HttpStatus.valueOf(goResponse.getStatusCode().value()), errorResponse);
            }
        } catch (HttpClientErrorException e) {
            ErrorResponse errorResponse = parseErrorResponse(e.getResponseBodyAsString());
            throw new GoApiException(HttpStatus.valueOf(e.getStatusCode().value()), errorResponse);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Méthode helper pour parser les réponses d'erreur de Go avec ObjectMapper
    private ErrorResponse parseErrorResponse(String responseBody) {
        try {
            return objectMapper.readValue(responseBody, ErrorResponse.class);
        } catch (JsonProcessingException e) {
            return new ErrorResponse("ERR999", "Invalid error response from Go API: " + e.getMessage());
        }
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