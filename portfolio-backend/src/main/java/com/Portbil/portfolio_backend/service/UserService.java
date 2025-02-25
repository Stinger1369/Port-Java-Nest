package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.dto.WeatherDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WeatherService weatherService;
    private final GoogleMapsService googleMapsService; // ✅ Importation correcte ajoutée

    // ID du développeur (à remplacer par votre ID réel)
    private final String DEVELOPER_ID = "developer-id-here"; // Remplacez par votre ID utilisateur
    private final String DEVELOPER_EMAIL = "developer-email@example.com"; // Remplacez par votre email

    /**
     * ✅ Récupérer tous les utilisateurs
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * ✅ Récupérer un utilisateur par ID
     */
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    /**
     * ✅ Mettre à jour les informations d'un utilisateur avec correction du format `firstName`, `lastName` et `slug`
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
            if (userDTO.getCity() != null) user.setCity(userDTO.getCity());
            if (userDTO.getCountry() != null) user.setCountry(userDTO.getCountry());

            // Validation et mise à jour du sexe
            if (userDTO.getSex() != null) {
                if (!isValidSex(userDTO.getSex())) {
                    throw new IllegalArgumentException("Sexe invalide. Les valeurs autorisées sont: 'Man', 'Woman', 'Other' ou vide.");
                }
                user.setSex(userDTO.getSex());
            }

            // Mise à jour du slug si fourni
            if (userDTO.getSlug() != null && !userDTO.getSlug().isEmpty()) {
                String newSlug = generateUniqueSlug(userDTO.getSlug(), id);
                user.setSlug(newSlug);
            }

            if (userDTO.getBio() != null) user.setBio(userDTO.getBio());

            // Mise à jour des coordonnées de géolocalisation
            if (userDTO.getLatitude() != null) user.setLatitude(userDTO.getLatitude());
            if (userDTO.getLongitude() != null) user.setLongitude(userDTO.getLongitude());

            User savedUser = userRepository.save(user);
            System.out.println("✅ Mise à jour réussie pour l'utilisateur ID: " + id);
            System.out.println("Phone enregistré dans MongoDB : " + savedUser.getPhone());
            return savedUser;
        });
    }

    /**
     * ✅ Nouvelle méthode : Mettre à jour l'adresse via Google Maps
     */
    public User updateUserAddressFromCoordinates(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));

        if (user.getLatitude() == null || user.getLongitude() == null) {
            throw new IllegalArgumentException("Les coordonnées latitude/longitude sont manquantes pour cet utilisateur.");
        }

        String address = googleMapsService.getAddressFromCoordinates(user.getLatitude(), user.getLongitude());
        user.setAddress(address);

        User updatedUser = userRepository.save(user);
        System.out.println("✅ Adresse mise à jour pour l'utilisateur ID : " + userId + " - Adresse : " + address);
        return updatedUser;
    }

    /**
     * ✅ Valider si la valeur de `sex` est correcte
     */
    private boolean isValidSex(String sex) {
        if (sex == null || sex.isEmpty()) return true;
        return sex.equalsIgnoreCase("Man") ||
                sex.equalsIgnoreCase("Woman") ||
                sex.equalsIgnoreCase("Other");
    }

    /**
     * ✅ Supprimer un utilisateur
     */
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    /**
     * ✅ Récupérer un utilisateur par email
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * ✅ Inscription avec génération d'un code de validation par email et slug unique
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
     * ✅ Vérification du compte utilisateur avec le code reçu par email
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
     * ✅ Vérification du mot de passe avec hashage
     */
    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    /**
     * ✅ Demande de réinitialisation du mot de passe
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
     * ✅ Réinitialisation du mot de passe
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
     * ✅ Générer un code de confirmation à 6 chiffres
     */
    private String generateConfirmationCode() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    /**
     * ✅ Méthode pour capitaliser la première lettre d'un mot
     */
    private String capitalizeFirstLetter(String input) {
        if (input == null || input.isEmpty()) return input;
        return input.substring(0, 1).toUpperCase() + input.substring(1).toLowerCase();
    }

    /**
     * ✅ Générer un slug unique basé sur une base donnée (email ou slug personnalisé)
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
     * ✅ Récupérer les données météo pour un utilisateur
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

    /**
     * ✅ Envoyer une demande de contact entre utilisateurs
     */
    public void sendUserContactRequest(String senderId, String receiverId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (receiver.getContactIds().contains(senderId)) {
            throw new RuntimeException("Contact already exists");
        }

        receiver.getContactIds().add(senderId);
        userRepository.save(receiver);

        String senderName = sender.getFirstName() + " " + sender.getLastName();
        String senderSlug = sender.getSlug() != null ? sender.getSlug() : "N/A";
        String portfolioLink = "http://localhost:5173/portfolio/" + sender.getFirstName() + "/" + sender.getLastName() + "/" + senderSlug;

        String htmlMessage = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
                a { color: #4CAF50; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Nouvelle demande de contact</h2>
                </div>
                <div class="content">
                    <p>Bonjour <strong>%s</strong>,</p>
                    <p>Vous avez reçu une nouvelle demande de contact de la part de <strong>%s</strong>.</p>
                    <p><strong>Détails du demandeur :</strong></p>
                    <ul>
                        <li>Email : %s</li>
                        <li>Téléphone : %s</li>
                    </ul>
                    <p>Consultez son portfolio ici : <a href="%s">%s</a></p>
                    <p>Pour répondre ou accepter cette demande, connectez-vous à votre compte et consultez vos demandes de contact.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Votre Application. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                receiver.getFirstName() != null ? receiver.getFirstName() : "Utilisateur",
                senderName,
                sender.getEmail(),
                sender.getPhone() != null ? sender.getPhone() : "Non fourni",
                portfolioLink,
                portfolioLink
        );

        emailService.sendEmail(
                receiver.getEmail(),
                "Nouvelle demande de contact",
                htmlMessage
        );
    }

    /**
     * ✅ Récupérer les contacts acceptés d’un utilisateur
     */
    public List<String> getUserContacts(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new ArrayList<>(user.getContactIds());
    }

    /**
     * ✅ Envoyer une demande de contact au développeur
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
     * ✅ Accepter une demande de contact du développeur
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
}