package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.UserCoordinatesDTO;
import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.dto.WeatherDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.entity.Image;
import com.Portbil.portfolio_backend.repository.ImageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public Optional<User> updateUser(String id, UserDTO userDTO) {
        return userRepository.findById(id).map(user -> {
            System.out.println("🔹 Mise à jour de l'utilisateur ID : " + id);
            System.out.println("Phone reçu du DTO : " + userDTO.getPhone());

            if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
                Optional<User> existingUser = userRepository.findByEmail(userDTO.getEmail());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                    throw new IllegalArgumentException("Cet email est déjà utilisé par un autre compte.");
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
                    throw new IllegalArgumentException("Sexe invalide. Les valeurs autorisées sont: 'Man', 'Woman', 'Other' ou vide.");
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
                    throw new IllegalArgumentException("Coordonnées géographiques invalides.");
                }
                user.setLatitude(latitude);
                user.setLongitude(longitude);

                Map<String, String> locationDetails = googleMapsService.getCityAndCountryFromCoordinates(latitude, longitude);
                user.setCity(locationDetails.get("city"));
                user.setCountry(locationDetails.get("country"));
            } else {
                // Si les coordonnées sont null ou 0, utiliser les valeurs city/country du DTO si fournies
                if (userDTO.getCity() != null) user.setCity(capitalizeFirstLetter(userDTO.getCity()));
                if (userDTO.getCountry() != null) user.setCountry(capitalizeFirstLetter(userDTO.getCountry()));
            }

            if (userDTO.getBirthdate() != null) {
                if (userDTO.getBirthdate().isAfter(LocalDate.now())) {
                    throw new IllegalArgumentException("La date de naissance ne peut pas être dans le futur");
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
    public Optional<User> updateUserCoordinates(String id, UserCoordinatesDTO coordinatesDTO) {
        return userRepository.findById(id).map(user -> {
            System.out.println("🔹 Mise à jour des coordonnées de l'utilisateur ID : " + id);
            System.out.println("🔹 Coordonnées reçues : latitude=" + coordinatesDTO.getLatitude() +
                    ", longitude=" + coordinatesDTO.getLongitude());

            if (coordinatesDTO.getLatitude() < -90 || coordinatesDTO.getLatitude() > 90 ||
                    coordinatesDTO.getLongitude() < -180 || coordinatesDTO.getLongitude() > 180) {
                throw new IllegalArgumentException("Coordonnées géographiques invalides.");
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
     * Mettre à jour l'adresse, la ville, et le pays via Google Maps (utilisé par GoogleMapsController)
     */
    public User updateUserAddressFromCoordinates(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));

        if (user.getLatitude() == null || user.getLongitude() == null) {
            throw new IllegalArgumentException("Les coordonnées latitude/longitude sont manquantes pour cet utilisateur.");
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
        return sex.equalsIgnoreCase("Man") ||
                sex.equalsIgnoreCase("Woman") ||
                sex.equalsIgnoreCase("Other");
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
    public User registerUser(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email déjà utilisé");
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

        emailService.sendEmail(email, "Confirmation de votre compte",
                "Bonjour,\n\nVotre code de validation est : " + confirmationCode +
                        "\n\nMerci de confirmer votre compte.\nVotre slug unique est : " + slug);

        return newUser;
    }

    /**
     * Vérification du compte utilisateur avec le code reçu par email
     */
    public boolean verifyUser(String email, String code) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur introuvable.");
        }

        User user = userOpt.get();

        if (user.getConfirmationCode() == null || !user.getConfirmationCode().equals(code)) {
            throw new IllegalArgumentException("Code de confirmation invalide.");
        }

        user.setVerified(true);
        user.setConfirmationCode(null);
        userRepository.save(user);
        return true;
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
    public void forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Aucun utilisateur trouvé avec cet email.");
        }

        User user = userOpt.get();
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(15);

        user.setResetToken(resetToken);
        user.setResetTokenExpiration(expirationTime);
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;

        emailService.sendEmail(email, "Réinitialisation de votre mot de passe",
                "Cliquez sur le lien suivant pour réinitialiser votre mot de passe (valide pendant 15 minutes) :\n\n" + resetLink);
    }

    /**
     * Réinitialisation du mot de passe
     */
    public void resetPassword(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Token invalide pour la réinitialisation.");
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiration() == null || user.getResetTokenExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Le lien de réinitialisation a expiré.");
        }

        if (user.getPreviousPasswords() == null) {
            user.setPreviousPasswords(new ArrayList<>());
        }

        for (String oldPassword : user.getPreviousPasswords()) {
            if (passwordEncoder.matches(newPassword, oldPassword)) {
                throw new IllegalArgumentException("⚠️ Ce mot de passe a déjà été utilisé.");
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
     * Récupérer les données météo pour un utilisateur (utilisé par WeatherController)
     */
    public WeatherDTO getWeatherForUser(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur introuvable.");
        }
        User user = userOpt.get();
        if (user.getLatitude() == null || user.getLongitude() == null) {
            throw new IllegalArgumentException("Coordonnées de géolocalisation manquantes.");
        }
        return weatherService.getWeather(user.getLatitude(), user.getLongitude());
    }
    public void removeFriend(String userId, String friendId) {
        if (userId == null || userId.isEmpty() || friendId == null || friendId.isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId));

        if (!user.getFriendIds().contains(friendId) || !friend.getFriendIds().contains(userId)) {
            throw new IllegalStateException("Ces utilisateurs ne sont pas amis.");
        }

        user.getFriendIds().remove(friendId);
        friend.getFriendIds().remove(userId);
        userRepository.save(user);
        userRepository.save(friend);
    }
    /**
     * Envoyer une demande de contact entre utilisateurs
     */
    public void sendUserContactRequest(String senderId, String receiverId) {
        if (senderId == null || senderId.isEmpty() || receiverId == null || receiverId.isEmpty()) {
            throw new IllegalArgumentException("Les identifiants de l'expéditeur ou du destinataire ne peuvent pas être nuls ou vides.");
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("L'expéditeur et le destinataire ne peuvent pas être la même personne.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Expéditeur introuvable : " + senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Destinataire introuvable : " + receiverId));

        if (receiver.getContactIds().contains(senderId)) {
            throw new IllegalStateException("Une demande de contact existe déjà entre ces utilisateurs.");
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

        emailService.sendEmail(
                receiver.getEmail(),
                "Nouvelle demande de contact",
                htmlMessage
        );

        System.out.println("✅ Demande de contact envoyée de " + senderId + " à " + receiverId);
    }

    /**
     * Récupérer les contacts acceptés d’un utilisateur
     */
    public List<String> getUserContacts(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new ArrayList<>(user.getContactIds());
    }

    /**
     * Envoyer une demande de contact au développeur
     */
    public void sendDeveloperContactRequest(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userRepository.findById(DEVELOPER_ID).isEmpty()) {
            throw new RuntimeException("Developer not found");
        }

        emailService.sendEmail(
                DEVELOPER_EMAIL,
                "New Developer Contact Request",
                "You have a new contact request from " + user.getFirstName() + " " + user.getLastName()
        );
    }

    /**
     * Accepter une demande de contact du développeur
     */
    public void acceptDeveloperContactRequest(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getContactIds().add(DEVELOPER_ID);
        userRepository.save(user);

        emailService.sendEmail(
                user.getEmail(),
                "Developer Contact Request Accepted",
                "Your developer contact request has been accepted"
        );
    }

    /**
     * Récupérer l’URL complète de la photo de profil par défaut d’un utilisateur
     */
    public String getProfilePictureUrl(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));

        if (user.getImageIds() == null || user.getImageIds().isEmpty()) {
            return null;
        }

        Image profileImage = imageRepository.findByUserIdAndIsProfilePicture(userId, true)
                .orElseGet(() -> {
                    return imageRepository.findByUserId(userId).stream()
                            .max((img1, img2) -> img1.getUploadedAt().compareTo(img2.getUploadedAt()))
                            .orElse(null);
                });

        if (profileImage == null) {
            return null;
        }

        return "http://localhost:7000/" + profileImage.getPath();
    }

    /**
     * Mettre à jour la photo de profil par défaut d’un utilisateur
     */
    public void updateProfilePictureUrl(String userId, String imagePath) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        user.setProfilePictureUrl(imagePath);
        userRepository.save(user);
    }

    /**
     * Permettre à un utilisateur de "liker" un autre utilisateur
     */
    public void likeUser(String likerId, String likedId) {
        if (likerId == null || likedId == null || likerId.trim().isEmpty() || likedId.trim().isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }
        if (likerId.equals(likedId)) {
            throw new IllegalArgumentException("Un utilisateur ne peut pas se liker lui-même.");
        }

        User liker = userRepository.findById(likerId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur liker introuvable : " + likerId));
        User liked = userRepository.findById(likedId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur liké introuvable : " + likedId));

        // Vérifier si la liste est initialisée
        if (liker.getLikedUserIds() == null) {
            liker.setLikedUserIds(new ArrayList<>());
        }
        if (liked.getLikerUserIds() == null) {
            liked.setLikerUserIds(new ArrayList<>());
        }

        if (liker.getLikedUserIds().contains(likedId)) {
            throw new IllegalStateException("Cet utilisateur a déjà été liké.");
        }

        liker.getLikedUserIds().add(likedId);
        liked.getLikerUserIds().add(likerId);

        userRepository.save(liker);
        userRepository.save(liked);
        System.out.println("✅ Utilisateur " + likerId + " a liké " + likedId);
    }

    /**
     * Permettre à un utilisateur de retirer son "like" d'un autre utilisateur
     */
    public void unlikeUser(String likerId, String likedId) {
        if (likerId == null || likedId == null || likerId.trim().isEmpty() || likedId.trim().isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }

        User liker = userRepository.findById(likerId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur liker introuvable : " + likerId));
        User liked = userRepository.findById(likedId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur liké introuvable : " + likedId));

        // Vérifier si la liste est initialisée
        if (liker.getLikedUserIds() == null || liked.getLikerUserIds() == null) {
            throw new IllegalStateException("Les données de like sont incohérentes pour cet utilisateur.");
        }

        if (!liker.getLikedUserIds().contains(likedId)) {
            throw new IllegalStateException("Cet utilisateur n'a pas été liké.");
        }

        liker.getLikedUserIds().remove(likedId);
        liked.getLikerUserIds().remove(likedId);

        userRepository.save(liker);
        userRepository.save(liked);
        System.out.println("✅ Utilisateur " + likerId + " a retiré son like de " + likedId);
    }

    /**
     * Récupérer les chatIds d’un utilisateur
     */
    public List<String> getUserChatIds(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return user.getChatIds();
    }
    /**
     * Envoyer une demande d'ami
     */
    public void sendFriendRequest(String senderId, String receiverId) {
        if (senderId == null || receiverId == null || senderId.trim().isEmpty() || receiverId.trim().isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Un utilisateur ne peut pas s'envoyer une demande d'ami à lui-même.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur expéditeur introuvable : " + senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur destinataire introuvable : " + receiverId));

        // Vérifier si les listes sont initialisées
        if (sender.getFriendRequestSentIds() == null) {
            sender.setFriendRequestSentIds(new ArrayList<>());
        }
        if (receiver.getFriendRequestReceivedIds() == null) {
            receiver.setFriendRequestReceivedIds(new ArrayList<>());
        }
        if (sender.getFriendIds() == null) {
            sender.setFriendIds(new ArrayList<>());
        }
        if (receiver.getFriendIds() == null) {
            receiver.setFriendIds(new ArrayList<>());
        }

        // Vérifier si une relation existe déjà
        if (sender.getFriendIds().contains(receiverId) || receiver.getFriendIds().contains(senderId)) {
            throw new IllegalStateException("Ces utilisateurs sont déjà amis.");
        }
        if (sender.getFriendRequestSentIds().contains(receiverId)) {
            throw new IllegalStateException("Une demande d'ami a déjà été envoyée à cet utilisateur.");
        }
        if (receiver.getFriendRequestSentIds().contains(senderId)) {
            throw new IllegalStateException("Cet utilisateur vous a déjà envoyé une demande d'ami. Veuillez l'accepter.");
        }

        // Ajouter la demande
        sender.getFriendRequestSentIds().add(receiverId);
        receiver.getFriendRequestReceivedIds().add(senderId);

        // Envoi d'un email au destinataire
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

        emailService.sendEmail(
                receiver.getEmail(),
                "Nouvelle demande d'ami",
                htmlMessage
        );

        userRepository.save(sender);
        userRepository.save(receiver);
        System.out.println("✅ Demande d'ami envoyée de " + senderId + " à " + receiverId);
    }

    /**
     * Accepter une demande d'ami
     */
    public void acceptFriendRequest(String userId, String friendId) {
        if (userId == null || friendId == null || userId.trim().isEmpty() || friendId.trim().isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId));

        // Vérifier si les listes sont initialisées
        if (user.getFriendRequestReceivedIds() == null || friend.getFriendRequestSentIds() == null) {
            throw new IllegalStateException("Aucune demande d'ami n'a été trouvée.");
        }
        if (user.getFriendIds() == null) {
            user.setFriendIds(new ArrayList<>());
        }
        if (friend.getFriendIds() == null) {
            friend.setFriendIds(new ArrayList<>());
        }

        // Vérifier si une demande existe
        if (!user.getFriendRequestReceivedIds().contains(friendId) || !friend.getFriendRequestSentIds().contains(userId)) {
            throw new IllegalStateException("Aucune demande d'ami n'a été envoyée par cet utilisateur.");
        }

        // Ajouter les utilisateurs comme amis
        user.getFriendIds().add(friendId);
        friend.getFriendIds().add(userId);

        // Supprimer la demande
        user.getFriendRequestReceivedIds().remove(friendId);
        friend.getFriendRequestSentIds().remove(userId);

        userRepository.save(user);
        userRepository.save(friend);
        System.out.println("✅ Demande d'ami acceptée entre " + userId + " et " + friendId);
    }

    /**
     * Refuser une demande d'ami
     */
    public void rejectFriendRequest(String userId, String friendId) {
        if (userId == null || friendId == null || userId.trim().isEmpty() || friendId.trim().isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId));

        // Vérifier si les listes sont initialisées
        if (user.getFriendRequestReceivedIds() == null || friend.getFriendRequestSentIds() == null) {
            throw new IllegalStateException("Aucune demande d'ami n'a été trouvée.");
        }

        // Vérifier si une demande existe
        if (!user.getFriendRequestReceivedIds().contains(friendId) || !friend.getFriendRequestSentIds().contains(userId)) {
            throw new IllegalStateException("Aucune demande d'ami n'a été envoyée par cet utilisateur.");
        }

        // Supprimer la demande
        user.getFriendRequestReceivedIds().remove(friendId);
        friend.getFriendRequestSentIds().remove(userId);

        userRepository.save(user);
        userRepository.save(friend);
        System.out.println("✅ Demande d'ami refusée entre " + userId + " et " + friendId);
    }


    /**
     * Annuler une demande d'ami envoyée
     */
    public void cancelFriendRequest(String senderId, String receiverId) {
        if (senderId == null || receiverId == null || senderId.trim().isEmpty() || receiverId.trim().isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur expéditeur introuvable : " + senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur destinataire introuvable : " + receiverId));

        // Vérifier si les listes sont initialisées
        if (sender.getFriendRequestSentIds() == null || receiver.getFriendRequestReceivedIds() == null) {
            throw new IllegalStateException("Aucune demande d'ami n'a été envoyée.");
        }

        // Vérifier si une demande existe
        if (!sender.getFriendRequestSentIds().contains(receiverId) || !receiver.getFriendRequestReceivedIds().contains(senderId)) {
            throw new IllegalStateException("Aucune demande d'ami n'a été envoyée à cet utilisateur.");
        }

        // Supprimer la demande
        sender.getFriendRequestSentIds().remove(receiverId);
        receiver.getFriendRequestReceivedIds().remove(senderId);

        userRepository.save(sender);
        userRepository.save(receiver);
        System.out.println("✅ Demande d'ami annulée de " + senderId + " à " + receiverId);
    }

    /**
     * Récupérer les amis d’un utilisateur
     */
    public List<User> getFriends(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));

        if (user.getFriendIds() == null || user.getFriendIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendIds());
    }

    /**
     * Récupérer les demandes d'amis envoyées
     */
    public List<User> getSentFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));

        if (user.getFriendRequestSentIds() == null || user.getFriendRequestSentIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendRequestSentIds());
    }

    /**
     * Récupérer les demandes d'amis reçues
     */
    public List<User> getReceivedFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));

        if (user.getFriendRequestReceivedIds() == null || user.getFriendRequestReceivedIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendRequestReceivedIds());
    }
}