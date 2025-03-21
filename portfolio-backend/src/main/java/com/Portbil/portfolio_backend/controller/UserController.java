package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.UserCoordinatesDTO;
import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("🔹 Récupération de la liste des utilisateurs (admin).");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsersForAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getName())) {
            System.out.println("❌ Tentative d'accès non authentifié à /api/users/all");
            return ResponseEntity.status(403).body(null);
        }

        System.out.println("🔹 Récupération de la liste des utilisateurs pour l'utilisateur authentifié: " + authentication.getName());
        List<User> users = userService.getAllUsers();

        List<UserDTO> userDTOs = users.stream().map(user -> UserDTO.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phone(user.getPhone())
                        .address(user.getAddress())
                        .city(user.getCity())
                        .country(user.getCountry())
                        .sex(user.getSex())
                        .slug(user.getSlug())
                        .bio(user.getBio())
                        .birthdate(user.getBirthdate())
                        .age(user.getAge())
                        .showBirthdate(user.isShowBirthdate())
                        .likedUserIds(user.getLikedUserIds())
                        .likerUserIds(user.getLikerUserIds())
                        .imageIds(user.getImageIds())
                        .latitude(user.getLatitude() != null ? user.getLatitude().toString() : null)
                        .longitude(user.getLongitude() != null ? user.getLongitude().toString() : null)
                        .friendIds(user.getFriendIds())
                        .friendRequestSentIds(user.getFriendRequestSentIds())
                        .friendRequestReceivedIds(user.getFriendRequestReceivedIds())
                        .build())
                .collect(Collectors.toList());

        System.out.println("✅ Tous les utilisateurs récupérés pour l'utilisateur authentifié: " + userDTOs);
        return ResponseEntity.ok(userDTOs);
    }
    @GetMapping("/verified")
    public ResponseEntity<List<UserDTO>> getVerifiedUsers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getName())) {
            System.out.println("❌ Tentative d'accès non authentifié à /api/users/verified");
            return ResponseEntity.status(403).body(null);
        }

        System.out.println("🔹 Récupération des utilisateurs vérifiés pour: " + authentication.getName());
        List<User> users = userService.getAllUsers();

        // Filtrer les utilisateurs vérifiés avec profil complet
        List<UserDTO> verifiedUserDTOs = users.stream()
                .filter(user -> user.isVerified() &&
                        user.getFirstName() != null && !user.getFirstName().trim().isEmpty() &&
                        user.getLastName() != null && !user.getLastName().trim().isEmpty())
                .map(user -> UserDTO.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phone(user.getPhone())
                        .address(user.getAddress())
                        .city(user.getCity())
                        .country(user.getCountry())
                        .sex(user.getSex())
                        .slug(user.getSlug())
                        .bio(user.getBio())
                        .birthdate(user.getBirthdate())
                        .age(user.getAge())
                        .showBirthdate(user.isShowBirthdate())
                        .likedUserIds(user.getLikedUserIds())
                        .likerUserIds(user.getLikerUserIds())
                        .imageIds(user.getImageIds())
                        .latitude(user.getLatitude() != null ? user.getLatitude().toString() : null)
                        .longitude(user.getLongitude() != null ? user.getLongitude().toString() : null)
                        .friendIds(user.getFriendIds())
                        .friendRequestSentIds(user.getFriendRequestSentIds())
                        .friendRequestReceivedIds(user.getFriendRequestReceivedIds())
                        .isVerified(user.isVerified()) // Ajouté
                        .build())
                .collect(Collectors.toList());

        System.out.println("✅ Utilisateurs vérifiés récupérés: " + verifiedUserDTOs.size());
        return ResponseEntity.ok(verifiedUserDTOs);
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or #id == authentication.principal.username")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        System.out.println("🔹 Tentative de récupération de l'utilisateur ID: " + id);
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isEmpty()) {
            System.out.println("❌ Utilisateur non trouvé : " + id);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        System.out.println("✅ Utilisateur trouvé : " + user.getEmail());
        System.out.println("Phone renvoyé au frontend : " + user.getPhone());
        System.out.println("Sex et Bio renvoyés au frontend : sex=" + user.getSex() +
                ", bio=" + user.getBio() +
                ", birthdate=" + user.getBirthdate() +
                ", age=" + user.getAge() +
                ", showBirthdate=" + user.isShowBirthdate() +
                ", likedUserIds=" + user.getLikedUserIds() +
                ", likerUserIds=" + user.getLikerUserIds() +
                ", imageIds=" + user.getImageIds() +
                ", friendIds=" + user.getFriendIds() +
                ", friendRequestSentIds=" + user.getFriendRequestSentIds() +
                ", friendRequestReceivedIds=" + user.getFriendRequestReceivedIds());

        UserDTO userDTO = UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .city(user.getCity())
                .country(user.getCountry())
                .sex(user.getSex())
                .slug(user.getSlug())
                .bio(user.getBio())
                .birthdate(user.getBirthdate())
                .age(user.getAge())
                .showBirthdate(user.isShowBirthdate())
                .likedUserIds(user.getLikedUserIds())
                .likerUserIds(user.getLikerUserIds())
                .imageIds(user.getImageIds())
                .latitude(user.getLatitude() != null ? user.getLatitude().toString() : null)
                .longitude(user.getLongitude() != null ? user.getLongitude().toString() : null)
                .friendIds(user.getFriendIds())
                .friendRequestSentIds(user.getFriendRequestSentIds())
                .friendRequestReceivedIds(user.getFriendRequestReceivedIds())
                .build();
        return ResponseEntity.ok(userDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("#id == authentication.principal.username")
    public ResponseEntity<?> updateUser(
            @PathVariable String id,
            @RequestBody Map<String, Object> requestBody,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        log.debug("Requête PUT reçue pour l'utilisateur ID: {}, JSON brut reçu: {}", id, requestBody);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.debug("Authentification récupérée : {}", authentication != null ? authentication.getName() : "null");

        System.out.println("🔹 Tentative de mise à jour de l'utilisateur ID: " + id);
        System.out.println("🔹 Corps de la requête reçu : " + requestBody);

        if (authentication == null || authentication.getPrincipal() == null) {
            log.error("❌ Utilisateur non authentifié !");
            return ResponseEntity.status(403).body("Accès interdit : utilisateur non authentifié !");
        }

        String authenticatedUserId = authentication.getName();
        log.debug("Utilisateur connecté avec ID : {}", authenticatedUserId);

        if (!authenticatedUserId.equals(id)) {
            log.warn("❌ Erreur : L'utilisateur {} ne peut modifier que son propre compte (ID: {}) !", authenticatedUserId, id);
            return ResponseEntity.status(403).body("Accès interdit : vous ne pouvez modifier que votre propre compte !");
        }

        try {
            if (requestBody.containsKey("latitude") && requestBody.containsKey("longitude") && requestBody.size() == 2) {
                UserCoordinatesDTO coordinatesDTO = new UserCoordinatesDTO();
                coordinatesDTO.setLatitude(Double.valueOf(requestBody.get("latitude").toString()));
                coordinatesDTO.setLongitude(Double.valueOf(requestBody.get("longitude").toString()));

                Optional<User> updatedUserOpt = userService.updateUserCoordinates(id, coordinatesDTO, locale);
                if (updatedUserOpt.isEmpty()) {
                    log.error("❌ Mise à jour des coordonnées impossible, utilisateur non trouvé : {}", id);
                    return ResponseEntity.notFound().build();
                }

                User updatedUser = updatedUserOpt.get();
                UserDTO responseDTO = UserDTO.builder()
                        .id(updatedUser.getId())
                        .email(updatedUser.getEmail())
                        .firstName(updatedUser.getFirstName())
                        .lastName(updatedUser.getLastName())
                        .phone(updatedUser.getPhone())
                        .address(updatedUser.getAddress())
                        .city(updatedUser.getCity())
                        .country(updatedUser.getCountry())
                        .sex(updatedUser.getSex())
                        .slug(updatedUser.getSlug())
                        .bio(updatedUser.getBio())
                        .birthdate(updatedUser.getBirthdate())
                        .age(updatedUser.getAge())
                        .showBirthdate(updatedUser.isShowBirthdate())
                        .likedUserIds(updatedUser.getLikedUserIds())
                        .likerUserIds(updatedUser.getLikerUserIds())
                        .imageIds(updatedUser.getImageIds())
                        .latitude(updatedUser.getLatitude() != null ? updatedUser.getLatitude().toString() : null)
                        .longitude(updatedUser.getLongitude() != null ? updatedUser.getLongitude().toString() : null)
                        .friendIds(updatedUser.getFriendIds())
                        .friendRequestSentIds(updatedUser.getFriendRequestSentIds())
                        .friendRequestReceivedIds(updatedUser.getFriendRequestReceivedIds())
                        .build();

                log.info("✅ Mise à jour des coordonnées réussie pour l'utilisateur ID: {}", id);
                return ResponseEntity.ok(responseDTO);
            } else {
                UserDTO userDTO = UserDTO.builder()
                        .email((String) requestBody.get("email"))
                        .firstName((String) requestBody.get("firstName"))
                        .lastName((String) requestBody.get("lastName"))
                        .phone((String) requestBody.get("phone"))
                        .address((String) requestBody.get("address"))
                        .city((String) requestBody.get("city"))
                        .country((String) requestBody.get("country"))
                        .sex((String) requestBody.get("sex"))
                        .slug((String) requestBody.get("slug"))
                        .bio((String) requestBody.get("bio"))
                        .birthdate(requestBody.get("birthdate") != null ? LocalDate.parse((String) requestBody.get("birthdate")) : null)
                        .showBirthdate(requestBody.get("showBirthdate") != null ? Boolean.parseBoolean(String.valueOf(requestBody.get("showBirthdate"))) : false)
                        .latitude(requestBody.get("latitude") != null ? String.valueOf(requestBody.get("latitude")) : null)
                        .longitude(requestBody.get("longitude") != null ? String.valueOf(requestBody.get("longitude")) : null)
                        .build();

                Optional<User> updatedUserOpt = userService.updateUser(id, userDTO, locale);
                if (updatedUserOpt.isEmpty()) {
                    log.error("❌ Mise à jour impossible, utilisateur non trouvé : {}", id);
                    return ResponseEntity.notFound().build();
                }

                User updatedUser = updatedUserOpt.get();
                UserDTO responseDTO = UserDTO.builder()
                        .id(updatedUser.getId())
                        .email(updatedUser.getEmail())
                        .firstName(updatedUser.getFirstName())
                        .lastName(updatedUser.getLastName())
                        .phone(updatedUser.getPhone())
                        .address(updatedUser.getAddress())
                        .city(updatedUser.getCity())
                        .country(updatedUser.getCountry())
                        .sex(updatedUser.getSex())
                        .slug(updatedUser.getSlug())
                        .bio(updatedUser.getBio())
                        .birthdate(updatedUser.getBirthdate())
                        .age(updatedUser.getAge())
                        .showBirthdate(updatedUser.isShowBirthdate())
                        .likedUserIds(updatedUser.getLikedUserIds())
                        .likerUserIds(updatedUser.getLikerUserIds())
                        .imageIds(updatedUser.getImageIds())
                        .latitude(updatedUser.getLatitude() != null ? updatedUser.getLatitude().toString() : null)
                        .longitude(updatedUser.getLongitude() != null ? updatedUser.getLongitude().toString() : null)
                        .friendIds(updatedUser.getFriendIds())
                        .friendRequestSentIds(updatedUser.getFriendRequestSentIds())
                        .friendRequestReceivedIds(updatedUser.getFriendRequestReceivedIds())
                        .build();

                log.info("✅ Mise à jour réussie pour l'utilisateur ID: {}", id);
                return ResponseEntity.ok(responseDTO);
            }
        } catch (IllegalArgumentException e) {
            log.error("⚠️ Erreur lors de la mise à jour : {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la mise à jour de l'utilisateur ID: {} - Message: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Erreur interne : " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or #id == authentication.principal.username")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String id,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        System.out.println("🔹 Tentative de suppression de l'utilisateur ID: " + id);

        if (authentication == null || authentication.getPrincipal() == null) {
            System.out.println("❌ Utilisateur non authentifié !");
            return ResponseEntity.status(403).build();
        }

        String authenticatedUserId = authentication.getName();
        System.out.println("✅ Utilisateur connecté avec ID : " + authenticatedUserId);

        if (!authenticatedUserId.equals(id) && !authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ADMIN"))) {
            System.out.println("❌ Erreur : Accès interdit !");
            return ResponseEntity.status(403).build();
        }

        try {
            userService.deleteUser(id); // Pas besoin de Locale ici car pas d'exception traduite
            System.out.println("✅ Suppression réussie pour l'utilisateur ID: " + id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Erreur lors de la suppression : " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{likerId}/like/{likedId}")
    @PreAuthorize("#likerId == authentication.principal.username")
    public ResponseEntity<Void> likeUser(
            @PathVariable String likerId,
            @PathVariable String likedId,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        System.out.println("🔹 Tentative de like de " + likedId + " par " + likerId);
        try {
            userService.likeUser(likerId, likedId, locale);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println("❌ Erreur lors du like : " + e.getMessage());
            return ResponseEntity.badRequest().body(null); // Retourne Void, pas de message
        }
    }

    @DeleteMapping("/{likerId}/unlike/{likedId}")
    @PreAuthorize("#likerId == authentication.principal.username")
    public ResponseEntity<Void> unlikeUser(
            @PathVariable String likerId,
            @PathVariable String likedId,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Locale locale = Locale.forLanguageTag(lang);
        System.out.println("🔹 Tentative de unlike de " + likedId + " par " + likerId);
        try {
            userService.unlikeUser(likerId, likedId, locale);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println("❌ Erreur lors du unlike : " + e.getMessage());
            return ResponseEntity.badRequest().body(null); // Retourne Void, pas de message
        }
    }
}