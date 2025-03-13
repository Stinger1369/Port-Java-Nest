package com.Portbil.portfolio_backend.service.user;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.entity.Message; // Import ajouté
import com.Portbil.portfolio_backend.entity.Report;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.MessageRepository; // Import ajouté
import com.Portbil.portfolio_backend.repository.ReportRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.EmailService;
import com.Portbil.portfolio_backend.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.io.IOException; // Import ajouté
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID; // Import ajouté

@Service
@RequiredArgsConstructor
public class UserRelationService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final MessageRepository messageRepository; // Injection ajoutée
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final MessageSource messageSource;
    private final String DEVELOPER_ID = "developer-id-here";
    private final String DEVELOPER_EMAIL = "developer-email@example.com";

    /**
     * Supprimer un ami
     */
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

    /**
     * Envoyer une demande de contact à un utilisateur
     */
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

    /**
     * Bloquer un utilisateur
     */
    public void blockUser(String blockerId, String blockedId, Locale locale) {
        if (blockerId == null || blockedId == null || blockerId.trim().isEmpty() || blockedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException(messageSource.getMessage("self.block", null, locale));
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{blockerId}, locale)));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{blockedId}, locale)));

        if (blocker.getBlockedUserIds() == null) {
            blocker.setBlockedUserIds(new ArrayList<>());
        }

        if (blocker.getBlockedUserIds().contains(blockedId)) {
            throw new IllegalStateException(messageSource.getMessage("user.already.blocked", null, locale));
        }

        // Ajouter l'utilisateur à la liste des bloqués
        blocker.getBlockedUserIds().add(blockedId);

        // Supprimer les relations d'amitié si elles existent
        if (blocker.getFriendIds().contains(blockedId)) {
            blocker.getFriendIds().remove(blockedId);
            blocked.getFriendIds().remove(blockerId);
        }

        // Supprimer les demandes d'ami en cours
        if (blocker.getFriendRequestSentIds().contains(blockedId)) {
            blocker.getFriendRequestSentIds().remove(blockedId);
            blocked.getFriendRequestReceivedIds().remove(blockerId);
        }
        if (blocker.getFriendRequestReceivedIds().contains(blockedId)) {
            blocker.getFriendRequestReceivedIds().remove(blockedId);
            blocked.getFriendRequestSentIds().remove(blockerId);
        }

        // Supprimer les "likes" mutuels
        if (blocker.getLikedUserIds().contains(blockedId)) {
            blocker.getLikedUserIds().remove(blockedId);
            blocked.getLikerUserIds().remove(blockerId);
        }
        if (blocker.getLikerUserIds().contains(blockedId)) {
            blocker.getLikerUserIds().remove(blockedId);
            blocked.getLikedUserIds().remove(blockerId);
        }

        userRepository.save(blocker);
        userRepository.save(blocked);
        System.out.println("✅ Utilisateur " + blockedId + " bloqué par " + blockerId);
    }

    /**
     * Débloquer un utilisateur
     */
    public void unblockUser(String blockerId, String blockedId, Locale locale) {
        if (blockerId == null || blockedId == null || blockerId.trim().isEmpty() || blockedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{blockerId}, locale)));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{blockedId}, locale)));

        if (blocker.getBlockedUserIds() == null || !blocker.getBlockedUserIds().contains(blockedId)) {
            throw new IllegalStateException(messageSource.getMessage("user.not.blocked", null, locale));
        }

        blocker.getBlockedUserIds().remove(blockedId);
        userRepository.save(blocker);
        System.out.println("✅ Utilisateur " + blockedId + " débloqué par " + blockerId);
    }

    /**
     * Signaler un utilisateur pour harcèlement
     */
    public void reportUser(String reporterId, String reportedId, String reason, String messageId, Locale locale) {
        if (reporterId == null || reportedId == null || reporterId.trim().isEmpty() || reportedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }
        if (reporterId.equals(reportedId)) {
            throw new IllegalArgumentException(messageSource.getMessage("self.report", null, locale));
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{reporterId}, locale)));
        User reported = userRepository.findById(reportedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{reportedId}, locale)));

        if (reported.getReportedByUserIds() == null) {
            reported.setReportedByUserIds(new ArrayList<>());
        }

        if (reported.getReportedByUserIds().contains(reporterId)) {
            throw new IllegalStateException(messageSource.getMessage("user.already.reported", null, locale));
        }

        reported.getReportedByUserIds().add(reporterId);
        userRepository.save(reported);

        // Créer un rapport dans la collection "reports"
        Report report = Report.builder()
                .id(UUID.randomUUID().toString())
                .reporterId(reporterId)
                .reportedId(reportedId)
                .reason(reason)
                .messageId(messageId)
                .chatId(messageId != null ? getChatIdFromMessage(messageId) : null)
                .timestamp(Instant.now())
                .status("PENDING")
                .build();
        reportRepository.save(report);

        // Envoyer un email à l'administrateur
        String reportMessage = String.format(
                "L'utilisateur %s %s (ID: %s) a signalé l'utilisateur %s %s (ID: %s) pour harcèlement. Raison : %s%s",
                reporter.getFirstName(), reporter.getLastName(), reporterId,
                reported.getFirstName(), reported.getLastName(), reportedId,
                reason,
                messageId != null ? " (Message ID: " + messageId + ")" : ""
        );
        emailService.sendEmail(DEVELOPER_EMAIL, "Signalement pour harcèlement", reportMessage);

        // Envoyer une notification WebSocket à l'admin
        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("reportId", report.getId());
            notificationData.put("reporterId", reporterId);
            notificationData.put("reportedId", reportedId);
            notificationData.put("reason", reason);
            if (messageId != null) {
                notificationData.put("messageId", messageId);
                notificationData.put("chatId", report.getChatId());
            }
            String notificationMessage = String.format(
                    "%s %s a signalé %s %s pour harcèlement : %s%s",
                    reporter.getFirstName(), reporter.getLastName(),
                    reported.getFirstName(), reported.getLastName(),
                    reason,
                    messageId != null ? " (Message ID: " + messageId + ")" : ""
            );
            chatWebSocketHandler.sendNotification(DEVELOPER_ID, "user_reported", notificationMessage, notificationData);
            chatWebSocketHandler.persistNotification(DEVELOPER_ID, "user_reported", notificationMessage, notificationData);
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification WebSocket à l'admin : " + e.getMessage());
        }

        System.out.println("✅ Utilisateur " + reportedId + " signalé par " + reporterId + " pour : " + reason + (messageId != null ? " (Message ID: " + messageId + ")" : ""));
    }

    // Méthode utilitaire pour récupérer le chatId à partir d’un messageId
    private String getChatIdFromMessage(String messageId) {
        return messageRepository.findById(messageId)
                .map(Message::getChatId)
                .orElse(null);
    }

    /**
     * Récupérer la liste des contacts d'un utilisateur
     */
    public List<String> getUserContacts(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        return new ArrayList<>(user.getContactIds());
    }

    /**
     * Envoyer une demande de contact au développeur
     */
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

    /**
     * Accepter une demande de contact du développeur
     */
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

    /**
     * Envoyer une demande d'ami
     */
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

    /**
     * Accepter une demande d'ami
     */
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

    /**
     * Refuser une demande d'ami
     */
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

    /**
     * Annuler une demande d'ami
     */
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

    /**
     * Récupérer la liste des amis d'un utilisateur
     */
    public List<User> getFriends(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getFriendIds() == null || user.getFriendIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendIds());
    }

    /**
     * Récupérer la liste des demandes d'ami envoyées
     */
    public List<User> getSentFriendRequests(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getFriendRequestSentIds() == null || user.getFriendRequestSentIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendRequestSentIds());
    }

    /**
     * Récupérer la liste des demandes d'ami reçues
     */
    public List<User> getReceivedFriendRequests(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));

        if (user.getFriendRequestReceivedIds() == null || user.getFriendRequestReceivedIds().isEmpty()) {
            return new ArrayList<>();
        }

        return userRepository.findAllById(user.getFriendRequestReceivedIds());
    }
}