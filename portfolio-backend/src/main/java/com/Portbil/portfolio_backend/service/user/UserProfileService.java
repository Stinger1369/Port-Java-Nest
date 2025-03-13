package com.Portbil.portfolio_backend.service.user;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.Image;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ImageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.GoogleMapsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleMapsService googleMapsService;
    private final ImageRepository imageRepository;
    private final MessageSource messageSource;

    /**
     * Mettre à jour les informations d'un utilisateur avec correction du format `firstName`, `lastName`, `slug`, `city`, et `country`
     */
    public Optional<User> updateUser(String id, UserDTO userDTO, Locale locale) {
        return userRepository.findById(id).map(user -> {
            System.out.println("🔹 Mise à jour de l'utilisateur ID : " + id);
            System.out.println("Phone reçu du DTO : " + userDTO.getPhone());

            if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
                Optional<User> existingUser = userRepository.findByEmail(userDTO.getEmail());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                    throw new IllegalArgumentException(messageSource.getMessage("email.already.used", null, locale));
                }
                user.setEmail(userDTO.getEmail());
            }

            if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }

            if (userDTO.getFirstName() != null) user.setFirstName(capitalizeFirstLetter(userDTO.getFirstName()));
            if (userDTO.getLastName() != null) user.setLastName(capitalizeFirstLetter(userDTO.getLastName()));
            if (userDTO.getPhone() != null) user.setPhone(userDTO.getPhone());
            if (userDTO.getAddress() != null) user.setAddress(userDTO.getAddress());

            if (userDTO.getSex() != null) {
                if (!isValidSex(userDTO.getSex())) {
                    throw new IllegalArgumentException(messageSource.getMessage("invalid.sex", null, locale));
                }
                user.setSex(userDTO.getSex());
            }

            if (userDTO.getSlug() != null && !userDTO.getSlug().isEmpty()) {
                String newSlug = generateUniqueSlug(userDTO.getSlug(), id);
                user.setSlug(newSlug);
            }

            if (userDTO.getBio() != null) user.setBio(userDTO.getBio());

            // Vérifier si les coordonnées sont valides avant d'appeler Google Maps
            Double latitude = userDTO.getLatitudeAsDouble();
            Double longitude = userDTO.getLongitudeAsDouble();
            if (latitude != null && longitude != null && latitude != 0 && longitude != 0) {
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                    throw new IllegalArgumentException(messageSource.getMessage("invalid.coordinates", null, locale));
                }
                user.setLatitude(latitude);
                user.setLongitude(longitude);

                Map<String, String> locationDetails = googleMapsService.getCityAndCountryFromCoordinates(latitude, longitude);
                user.setCity(locationDetails.get("city"));
                user.setCountry(locationDetails.get("country"));
            } else {
                if (userDTO.getCity() != null) user.setCity(capitalizeFirstLetter(userDTO.getCity()));
                if (userDTO.getCountry() != null) user.setCountry(capitalizeFirstLetter(userDTO.getCountry()));
            }

            if (userDTO.getBirthdate() != null) {
                if (userDTO.getBirthdate().isAfter(LocalDate.now())) {
                    throw new IllegalArgumentException(messageSource.getMessage("invalid.birthdate", null, locale));
                }
                user.setBirthdate(userDTO.getBirthdate());
                System.out.println("🔹 Date de naissance mise à jour : " + userDTO.getBirthdate());
            }

            user.setShowBirthdate(userDTO.isShowBirthdate());
            System.out.println("🔹 ShowBirthdate mis à jour : " + userDTO.isShowBirthdate());

            User savedUser = userRepository.save(user);
            System.out.println("✅ Mise à jour réussie pour l'utilisateur ID: " + id);
            System.out.println("Phone enregistré dans MongoDB : " + savedUser.getPhone());
            System.out.println("Ville et pays enregistrés : city=" + savedUser.getCity() +
                    ", country=" + savedUser.getCountry() +
                    ", birthdate=" + (savedUser.isShowBirthdate() ? savedUser.getBirthdate() : "hidden") +
                    ", age=" + (savedUser.isShowBirthdate() ? savedUser.getAge() : "hidden") +
                    ", showBirthdate=" + savedUser.isShowBirthdate());
            return savedUser;
        });
    }

    /**
     * Récupérer l'URL de la photo de profil d'un utilisateur
     */
    public String getProfilePictureUrl(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getImageIds() == null || user.getImageIds().isEmpty()) {
            return null;
        }

        Image profileImage = imageRepository.findByUserIdAndIsProfilePicture(userId, true)
                .orElseGet(() -> imageRepository.findByUserId(userId).stream()
                        .max(Comparator.comparing(Image::getUploadedAt))
                        .orElse(null));

        return profileImage != null ? "http://localhost:7000/" + profileImage.getPath() : null;
    }

    /**
     * Mettre à jour l'URL de la photo de profil d'un utilisateur
     */
    public void updateProfilePictureUrl(String userId, String imagePath, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        user.setProfilePictureUrl(imagePath);
        userRepository.save(user);
    }

    /**
     * Valider si la valeur de `sex` est correcte
     */
    private boolean isValidSex(String sex) {
        if (sex == null || sex.isEmpty()) return true;
        return sex.equalsIgnoreCase("Man") || sex.equalsIgnoreCase("Woman") || sex.equalsIgnoreCase("Other");
    }

    /**
     * Méthode pour capitaliser la première lettre d'un mot
     */
    private String capitalizeFirstLetter(String input) {
        if (input == null || input.isEmpty()) return input;
        return input.substring(0, 1).toUpperCase() + input.substring(1).toLowerCase();
    }

    /**
     * Générer un slug unique basé sur une base donnée (email ou slug personnalisé)
     */
    private String generateUniqueSlug(String baseSlug, String userId) {
        String slug = baseSlug.toLowerCase().replaceAll("[^a-z0-9]", "-");
        String uniqueSlug = slug;
        int counter = 1;

        while (userRepository.findBySlug(uniqueSlug).isPresent() &&
                (userId == null || !userRepository.findBySlug(uniqueSlug).get().getId().equals(userId))) {
            uniqueSlug = slug + "-" + counter++;
        }
        return uniqueSlug;
    }
}