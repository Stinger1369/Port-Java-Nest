package com.Portbil.portfolio_backend.service.user;

import com.Portbil.portfolio_backend.dto.UserCoordinatesDTO;
import com.Portbil.portfolio_backend.dto.WeatherDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.GoogleMapsService;
import com.Portbil.portfolio_backend.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserMetadataService {

    private final UserRepository userRepository;
    private final WeatherService weatherService;
    private final GoogleMapsService googleMapsService;
    private final MessageSource messageSource;

    /**
     * Mettre à jour uniquement les coordonnées d'un utilisateur
     */
    public Optional<User> updateUserCoordinates(String id, UserCoordinatesDTO coordinatesDTO, Locale locale) {
        return userRepository.findById(id).map(user -> {
            System.out.println("🔹 Mise à jour des coordonnées de l'utilisateur ID : " + id);
            System.out.println("🔹 Coordonnées reçues : latitude=" + coordinatesDTO.getLatitude() +
                    ", longitude=" + coordinatesDTO.getLongitude());

            if (coordinatesDTO.getLatitude() < -90 || coordinatesDTO.getLatitude() > 90 ||
                    coordinatesDTO.getLongitude() < -180 || coordinatesDTO.getLongitude() > 180) {
                throw new IllegalArgumentException(messageSource.getMessage("invalid.coordinates", null, locale));
            }

            user.setLatitude(coordinatesDTO.getLatitude());
            user.setLongitude(coordinatesDTO.getLongitude());

            Map<String, String> locationDetails = googleMapsService.getCityAndCountryFromCoordinates(
                    coordinatesDTO.getLatitude(), coordinatesDTO.getLongitude());
            user.setCity(locationDetails.get("city"));
            user.setCountry(locationDetails.get("country"));

            User savedUser = userRepository.save(user);
            System.out.println("✅ Mise à jour des coordonnées réussie pour l'utilisateur ID: " + id);
            System.out.println("Ville et pays enregistrés : city=" + savedUser.getCity() +
                    ", country=" + savedUser.getCountry());
            return savedUser;
        });
    }

    /**
     * Mettre à jour l'adresse, la ville, et le pays via Google Maps
     */
    public User updateUserAddressFromCoordinates(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getLatitude() == null || user.getLongitude() == null) {
            throw new IllegalArgumentException(messageSource.getMessage("missing.coordinates", null, locale));
        }

        String address = googleMapsService.getAddressFromCoordinates(user.getLatitude(), user.getLongitude());
        user.setAddress(address);

        Map<String, String> locationDetails = googleMapsService.getCityAndCountryFromCoordinates(
                user.getLatitude(), user.getLongitude());
        user.setCity(locationDetails.get("city"));
        user.setCountry(locationDetails.get("country"));

        User updatedUser = userRepository.save(user);
        System.out.println("✅ Adresse mise à jour pour l'utilisateur ID : " + userId + " - Adresse : " + address);
        System.out.println("Ville et pays enregistrés : city=" + updatedUser.getCity() + ", country=" + updatedUser.getCountry());
        return updatedUser;
    }

    /**
     * Récupérer les données météo pour un utilisateur
     */
    public WeatherDTO getWeatherForUser(String userId, Locale locale) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale));
        }
        User user = userOpt.get();
        if (user.getLatitude() == null || user.getLongitude() == null) {
            throw new IllegalArgumentException(messageSource.getMessage("missing.coordinates", null, locale));
        }
        return weatherService.getWeather(user.getLatitude(), user.getLongitude());
    }
}