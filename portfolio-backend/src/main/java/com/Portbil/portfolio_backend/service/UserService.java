package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.dto.UserCoordinatesDTO;
import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.dto.WeatherDTO;
import com.Portbil.portfolio_backend.entity.Image;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ImageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WeatherService weatherService;
    private final GoogleMapsService googleMapsService;
    private final EmailTemplateService emailTemplateService;
    private final ImageRepository imageRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final MessageSource messageSource; // Injection de MessageSource
    private final String DEVELOPER_ID = "developer-id-here";
    private final String DEVELOPER_EMAIL = "developer-email@example.com";

    /**
     * Récupérer tous les utilisateurs
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

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
     * Valider si la valeur de `sex` est correcte
     */
    private boolean isValidSex(String sex) {
        if (sex == null || sex.isEmpty()) return true;
        return sex.equalsIgnoreCase("Man") || sex.equalsIgnoreCase("Woman") || sex.equalsIgnoreCase("Other");
    }

    /**
     * Supprimer un utilisateur
     */
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    /**
     * Récupérer un utilisateur par email
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Inscription avec génération d'un code de validation par email et slug unique
     */
    public User registerUser(String email, String password, Locale locale) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException(messageSource.getMessage("email.already.used", null, locale));
        }

        String confirmationCode = generateConfirmationCode();
        String slug = generateUniqueSlug(email.split("@")[0], null);

        User newUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .isVerified(false)
                .confirmationCode(confirmationCode)
                .slug(slug)
                .previousPasswords(new ArrayList<>())
                .build();

        userRepository.save(newUser);

        String htmlContent = emailTemplateService.generateVerificationEmail(
                null, confirmationCode, slug, "http://localhost:5173/verify-account?email=" + email
        );

        emailService.sendEmail(email, "Confirmation de votre compte", htmlContent);
        return newUser;
    }

    /**
     * Vérification du compte utilisateur avec le code reçu par email
     */
    public boolean verifyUser(String email, String code, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{email}, locale));
        }

        User user = userOpt.get();

        if (user.getConfirmationCode() == null || !user.getConfirmationCode().equals(code)) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.code", null, locale));
        }

        user.setVerified(true);
        user.setConfirmationCode(null);
        userRepository.save(user);
        return true;
    }

    /**
     * Renvoyer un nouveau code de vérification avec limitation
     */
    public void resendVerificationCode(String email, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{email}, locale));
        }

        User user = userOpt.get();
        if (user.isVerified()) {
            throw new IllegalArgumentException(messageSource.getMessage("account.already.verified", null, locale));
        }

        LocalDateTime now = LocalDateTime.now();
        long minutesSinceLastRequest = user.getLastVerificationCodeRequest() != null
                ? ChronoUnit.MINUTES.between(user.getLastVerificationCodeRequest(), now)
                : Long.MAX_VALUE;

        if (minutesSinceLastRequest > 60) {
            user.setVerificationCodeRequestCount(0);
        }

        if (user.getVerificationCodeRequestCount() >= 5) {
            throw new IllegalArgumentException(
                    messageSource.getMessage("too.many.requests.code", new Object[]{60 - minutesSinceLastRequest}, locale)
            );
        }

        String newConfirmationCode = generateConfirmationCode();
        user.setConfirmationCode(newConfirmationCode);
        user.setLastVerificationCodeRequest(now);
        user.setVerificationCodeRequestCount(user.getVerificationCodeRequestCount() + 1);
        userRepository.save(user);

        String htmlContent = emailTemplateService.generateVerificationEmail(
                user.getFirstName(), newConfirmationCode, user.getSlug(),
                "http://localhost:5173/verify-account?email=" + email
        );

        emailService.sendEmail(email, "Nouveau code de vérification", htmlContent);
        System.out.println("✅ Nouveau code de vérification envoyé à " + email + " : " + newConfirmationCode);
    }

    /**
     * Vérification du mot de passe avec hashage
     */
    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    /**
     * Demande de réinitialisation du mot de passe
     */
    public void forgotPassword(String email, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{email}, locale));
        }

        User user = userOpt.get();
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(15);

        user.setResetToken(resetToken);
        user.setResetTokenExpiration(expirationTime);
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;

        String htmlContent = emailTemplateService.generateResetPasswordEmail(user.getFirstName(), resetLink);
        emailService.sendEmail(email, "Réinitialisation de votre mot de passe", htmlContent);
    }

    /**
     * Réinitialisation du mot de passe
     */
    public void resetPassword(String token, String newPassword, Locale locale) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.token", null, locale));
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiration() == null || user.getResetTokenExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(messageSource.getMessage("expired.reset.link", null, locale));
        }

        if (user.getPreviousPasswords() == null) {
            user.setPreviousPasswords(new ArrayList<>());
        }

        for (String oldPassword : user.getPreviousPasswords()) {
            if (passwordEncoder.matches(newPassword, oldPassword)) {
                throw new IllegalArgumentException(messageSource.getMessage("password.previously.used", null, locale));
            }
        }

        user.getPreviousPasswords().add(user.getPassword());
        if (user.getPreviousPasswords().size() > 5) {
            user.getPreviousPasswords().remove(0);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiration(null);
        user.setVerified(true);
        userRepository.save(user);
    }

    /**
     * Générer un code de confirmation à 6 chiffres
     */
    private String generateConfirmationCode() {
        return String.valueOf(100000 + new Random().nextInt(900000));
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

    public void removeFriend(String userId, String friendId, Locale locale) {
        if (userId == null || userId.isEmpty() || friendId == null || friendId.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{friendId}, locale)));

        if (!user.getFriendIds().contains(friendId) || !friend.getFriendIds().contains(userId)) {
            throw new IllegalStateException(messageSource.getMessage("not.friends", null, locale));
        }

        user.getFriendIds().remove(friendId);
        friend.getFriendIds().remove(userId);
        userRepository.save(user);
        userRepository.save(friend);
    }

    public void sendUserContactRequest(String senderId, String receiverId, Locale locale) {
        if (senderId == null || senderId.isEmpty() || receiverId == null || receiverId.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException(messageSource.getMessage("same.user.contact", null, locale));
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{senderId}, locale)));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{receiverId}, locale)));

        if (receiver.getContactIds().contains(senderId)) {
            throw new IllegalStateException(messageSource.getMessage("contact.request.exists", null, locale));
        }

        receiver.getContactIds().add(senderId);
        userRepository.save(receiver);

        String senderName = Optional.ofNullable(sender.getFirstName())
                .map(fn -> fn + " " + Optional.ofNullable(sender.getLastName()).orElse(""))
                .orElse("Utilisateur inconnu");
        String senderSlug = Optional.ofNullable(sender.getSlug()).orElse("N/A");
        String portfolioLink = "http://localhost:5173/portfolio/" + sender.getFirstName() + "/" + sender.getLastName() + "/" + senderSlug;

        String htmlMessage = emailTemplateService.generateContactRequestEmail(
                Optional.ofNullable(receiver.getFirstName()).orElse("Utilisateur"),
                senderName,
                sender.getEmail(),
                Optional.ofNullable(sender.getPhone()).orElse("Non fourni"),
                portfolioLink
        );

        emailService.sendEmail(receiver.getEmail(), "Nouvelle demande de contact", htmlMessage);
        System.out.println("✅ Demande de contact envoyée de " + senderId + " à " + receiverId);
    }

    public List<String> getUserContacts(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        return new ArrayList<>(user.getContactIds());
    }

    public void sendDeveloperContactRequest(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (userRepository.findById(DEVELOPER_ID).isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{DEVELOPER_ID}, locale));
        }

        emailService.sendEmail(
                DEVELOPER_EMAIL,
                "New Developer Contact Request",
                "You have a new contact request from " + user.getFirstName() + " " + user.getLastName()
        );
    }

    public void acceptDeveloperContactRequest(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        user.getContactIds().add(DEVELOPER_ID);
        userRepository.save(user);

        emailService.sendEmail(
                user.getEmail(),
                "Developer Contact Request Accepted",
                "Your developer contact request has been accepted"
        );
    }

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

    public void updateProfilePictureUrl(String userId, String imagePath, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        user.setProfilePictureUrl(imagePath);
        userRepository.save(user);
    }

    public void likeUser(String likerId, String likedId, Locale locale) {
        if (likerId == null || likedId == null || likerId.trim().isEmpty() || likedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }
        if (likerId.equals(likedId)) {
            throw new IllegalArgumentException(messageSource.getMessage("self.like", null, locale));
        }

        User liker = userRepository.findById(likerId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likerId}, locale)));
        User liked = userRepository.findById(likedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likedId}, locale)));

        if (liker.getLikedUserIds() == null) {
            liker.setLikedUserIds(new ArrayList<>());
        }
        if (liked.getLikerUserIds() == null) {
            liked.setLikerUserIds(new ArrayList<>());
        }

        if (liker.getLikedUserIds().contains(likedId)) {
            throw new IllegalStateException(messageSource.getMessage("already.liked", null, locale));
        }

        liker.getLikedUserIds().add(likedId);
        liked.getLikerUserIds().add(likerId);

        userRepository.save(liker);
        userRepository.save(liked);
        System.out.println("✅ Utilisateur " + likerId + " a liké " + likedId);

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("likerId", likerId);
            String likerName = Optional.ofNullable(liker.getFirstName())
                    .map(fn -> fn + " " + Optional.ofNullable(liker.getLastName()).orElse(""))
                    .orElse("Utilisateur inconnu");
            chatWebSocketHandler.sendNotification(
                    likedId,
                    "user_like",
                    likerName + " a liké votre profil !",
                    notificationData
            );
            chatWebSocketHandler.persistNotification(
                    likedId,
                    "user_like",
                    likerName + " a liké votre profil !",
                    notificationData
            );
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification de like : " + e.getMessage());
        }
    }

    public void unlikeUser(String likerId, String likedId, Locale locale) {
        if (likerId == null || likedId == null || likerId.trim().isEmpty() || likedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User liker = userRepository.findById(likerId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likerId}, locale)));
        User liked = userRepository.findById(likedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likedId}, locale)));

        if (liker.getLikedUserIds() == null || liked.getLikerUserIds() == null) {
            throw new IllegalStateException(messageSource.getMessage("inconsistent.like.data", null, locale));
        }

        if (!liker.getLikedUserIds().contains(likedId)) {
            throw new IllegalStateException(messageSource.getMessage("not.liked", null, locale));
        }

        liker.getLikedUserIds().remove(likedId);
        liked.getLikerUserIds().remove(likerId);

        userRepository.save(liker);
        userRepository.save(liked);
        System.out.println("✅ Utilisateur " + likerId + " a retiré son like de " + likedId);

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("likerId", likerId);
            String likerName = Optional.ofNullable(liker.getFirstName())
                    .map(fn -> fn + " " + Optional.ofNullable(liker.getLastName()).orElse(""))
                    .orElse("Utilisateur inconnu");
            chatWebSocketHandler.sendNotification(
                    likedId,
                    "user_unlike",
                    likerName + " a retiré son like de votre profil.",
                    notificationData
            );
            chatWebSocketHandler.persistNotification(
                    likedId,
                    "user_unlike",
                    likerName + " a retiré son like de votre profil.",
                    notificationData
            );
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification de unlike : " + e.getMessage());
        }
    }

    public List<String> getUserChatIds(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        return user.getChatIds();
    }

    public void sendFriendRequest(String senderId, String receiverId, Locale locale) {
        if (senderId == null || receiverId == null || senderId.trim().isEmpty() || receiverId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException(messageSource.getMessage("self.friend.request", null, locale));
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{senderId}, locale)));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{receiverId}, locale)));

        if (sender.getFriendRequestSentIds() == null) sender.setFriendRequestSentIds(new ArrayList<>());
        if (receiver.getFriendRequestReceivedIds() == null) receiver.setFriendRequestReceivedIds(new ArrayList<>());
        if (sender.getFriendIds() == null) sender.setFriendIds(new ArrayList<>());
        if (receiver.getFriendIds() == null) receiver.setFriendIds(new ArrayList<>());

        if (sender.getFriendIds().contains(receiverId) || receiver.getFriendIds().contains(senderId)) {
            throw new IllegalStateException(messageSource.getMessage("already.friends", null, locale));
        }
        if (sender.getFriendRequestSentIds().contains(receiverId)) {
            throw new IllegalStateException(messageSource.getMessage("friend.request.sent", null, locale));
        }
        if (receiver.getFriendRequestSentIds().contains(senderId)) {
            throw new IllegalStateException(messageSource.getMessage("friend.request.received", null, locale));
        }

        sender.getFriendRequestSentIds().add(receiverId);
        receiver.getFriendRequestReceivedIds().add(senderId);

        String senderName = Optional.ofNullable(sender.getFirstName())
                .map(fn -> fn + " " + Optional.ofNullable(sender.getLastName()).orElse(""))
                .orElse("Utilisateur inconnu");
        String senderSlug = Optional.ofNullable(sender.getSlug()).orElse("N/A");
        String portfolioLink = "http://localhost:5173/portfolio/" + sender.getFirstName() + "/" + sender.getLastName() + "/" + senderSlug;

        String htmlMessage = emailTemplateService.generateContactRequestEmail(
                Optional.ofNullable(receiver.getFirstName()).orElse("Utilisateur"),
                senderName,
                sender.getEmail(),
                Optional.ofNullable(sender.getPhone()).orElse("Non fourni"),
                portfolioLink
        );

        emailService.sendEmail(receiver.getEmail(), "Nouvelle demande d'ami", htmlMessage);

        userRepository.save(sender);
        userRepository.save(receiver);
        System.out.println("✅ Demande d'ami envoyée de " + senderId + " à " + receiverId);
    }

    public void acceptFriendRequest(String userId, String friendId, Locale locale) {
        if (userId == null || friendId == null || userId.trim().isEmpty() || friendId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{friendId}, locale)));

        if (user.getFriendRequestReceivedIds() == null || friend.getFriendRequestSentIds() == null) {
            throw new IllegalStateException(messageSource.getMessage("no.friend.request", null, locale));
        }
        if (user.getFriendIds() == null) user.setFriendIds(new ArrayList<>());
        if (friend.getFriendIds() == null) friend.setFriendIds(new ArrayList<>());

        if (!user.getFriendRequestReceivedIds().contains(friendId) || !friend.getFriendRequestSentIds().contains(userId)) {
            throw new IllegalStateException(messageSource.getMessage("no.friend.request", null, locale));
        }

        user.getFriendIds().add(friendId);
        friend.getFriendIds().add(userId);

        user.getFriendRequestReceivedIds().remove(friendId);
        friend.getFriendRequestSentIds().remove(userId);

        userRepository.save(user);
        userRepository.save(friend);
        System.out.println("✅ Demande d'ami acceptée entre " + userId + " et " + friendId);
    }

    public void rejectFriendRequest(String userId, String friendId, Locale locale) {
        if (userId == null || friendId == null || userId.trim().isEmpty() || friendId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{friendId}, locale)));

        if (user.getFriendRequestReceivedIds() == null || friend.getFriendRequestSentIds() == null) {
            throw new IllegalStateException(messageSource.getMessage("no.friend.request", null, locale));
        }

        if (!user.getFriendRequestReceivedIds().contains(friendId) || !friend.getFriendRequestSentIds().contains(userId)) {
            throw new IllegalStateException(messageSource.getMessage("no.friend.request", null, locale));
        }

        user.getFriendRequestReceivedIds().remove(friendId);
        friend.getFriendRequestSentIds().remove(userId);

        userRepository.save(user);
        userRepository.save(friend);
        System.out.println("✅ Demande d'ami refusée entre " + userId + " et " + friendId);
    }

    public void cancelFriendRequest(String senderId, String receiverId, Locale locale) {
        if (senderId == null || receiverId == null || senderId.trim().isEmpty() || receiverId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{senderId}, locale)));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{receiverId}, locale)));

        if (sender.getFriendRequestSentIds() == null || receiver.getFriendRequestReceivedIds() == null) {
            throw new IllegalStateException(messageSource.getMessage("no.friend.request", null, locale));
        }

        if (!sender.getFriendRequestSentIds().contains(receiverId) || !receiver.getFriendRequestReceivedIds().contains(senderId)) {
            throw new IllegalStateException(messageSource.getMessage("no.friend.request", null, locale));
        }

        sender.getFriendRequestSentIds().remove(receiverId);
        receiver.getFriendRequestReceivedIds().remove(senderId);

        userRepository.save(sender);
        userRepository.save(receiver);
        System.out.println("✅ Demande d'ami annulée de " + senderId + " à " + receiverId);
    }

    public List<User> getFriends(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getFriendIds() == null || user.getFriendIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendIds());
    }

    public List<User> getSentFriendRequests(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getFriendRequestSentIds() == null || user.getFriendRequestSentIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendRequestSentIds());
    }

    public List<User> getReceivedFriendRequests(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getFriendRequestReceivedIds() == null || user.getFriendRequestReceivedIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendRequestReceivedIds());
    }
}