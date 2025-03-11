package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.dto.FriendRequestDTO;
import com.Portbil.portfolio_backend.entity.FriendRequest;
import com.Portbil.portfolio_backend.entity.Notification;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.FriendRequestRepository;
import com.Portbil.portfolio_backend.repository.NotificationRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FriendRequestService {

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    @Autowired
    private NotificationRepository notificationRepository;

    public FriendRequestDTO sendFriendRequest(String senderId, String receiverId) {
        if (senderId == null || senderId.isEmpty() || receiverId == null || receiverId.isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Un utilisateur ne peut pas envoyer une demande d'ami à lui-même.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur expéditeur introuvable : " + senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur destinataire introuvable : " + receiverId));

        if (friendRequestRepository.findBySenderIdAndReceiverIdAndStatus(senderId, receiverId, "PENDING").isPresent()) {
            throw new IllegalStateException("Une demande d'ami en attente existe déjà entre ces utilisateurs.");
        }

        if (sender.getFriendIds().contains(receiverId) || receiver.getFriendIds().contains(senderId)) {
            throw new IllegalStateException("Ces utilisateurs sont déjà amis.");
        }

        FriendRequest friendRequest = FriendRequest.builder()
                .id(UUID.randomUUID().toString())
                .sender(sender)
                .receiver(receiver)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        friendRequest = friendRequestRepository.save(friendRequest);

        // Ajouter l'ID de la demande aux listes des utilisateurs
        String requestId = friendRequest.getId();
        if (!sender.getFriendRequestSentIds().contains(requestId)) {
            sender.getFriendRequestSentIds().add(requestId);
            userRepository.save(sender);
            System.out.println("✅ Ajouté " + requestId + " à friendRequestSentIds de " + senderId);
        }
        if (!receiver.getFriendRequestReceivedIds().contains(requestId)) {
            receiver.getFriendRequestReceivedIds().add(requestId);
            userRepository.save(receiver);
            System.out.println("✅ Ajouté " + requestId + " à friendRequestReceivedIds de " + receiverId);
        }

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("requestId", friendRequest.getId());
            notificationData.put("fromUserId", sender.getId());
            notificationData.put("firstName", sender.getFirstName());
            notificationData.put("lastName", sender.getLastName());
            notificationData.put("email", sender.getEmail());
            notificationData.put("profilePictureUrl", sender.getProfilePictureUrl() != null ? sender.getProfilePictureUrl() : "");

            String receiverMessage = "Nouvelle demande d'ami reçue de " + sender.getFirstName() + " " + sender.getLastName();
            chatWebSocketHandler.sendNotification(receiverId, "friend_request_received", receiverMessage, notificationData);
            persistNotification(receiverId, "friend_request_received", receiverMessage, notificationData);

            String senderMessage = "Demande d'ami envoyée avec succès à " + receiver.getFirstName() + " " + receiver.getLastName();
            notificationData.put("toUserId", receiverId);
            chatWebSocketHandler.sendNotification(senderId, "friend_request_sent", senderMessage, notificationData);
            persistNotification(senderId, "friend_request_sent", senderMessage, notificationData);

            System.out.println("📢 Notifications envoyées et persistantées pour sendFriendRequest (sender: " + senderId + ", receiver: " + receiverId + ")");
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi des notifications pour sendFriendRequest : " + e.getMessage());
        }

        return mapToDTO(friendRequest);
    }

    public FriendRequestDTO acceptFriendRequest(String requestId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Demande d'ami introuvable : " + requestId));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!friendRequest.getReceiver().getId().equals(currentUserId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à accepter cette demande d'ami.");
        }

        if (!friendRequest.getStatus().equals("PENDING")) {
            throw new IllegalStateException("La demande d'ami n'est pas en attente. Statut actuel : " + friendRequest.getStatus());
        }

        friendRequest.setStatus("ACCEPTED");
        friendRequest.setUpdatedAt(LocalDateTime.now());
        friendRequest = friendRequestRepository.save(friendRequest);

        User sender = friendRequest.getSender();
        User receiver = friendRequest.getReceiver();

        if (!sender.getFriendIds().contains(receiver.getId())) {
            sender.getFriendIds().add(receiver.getId());
        }
        if (!receiver.getFriendIds().contains(sender.getId())) {
            receiver.getFriendIds().add(sender.getId());
        }

        sender.getFriendRequestSentIds().remove(friendRequest.getId());
        receiver.getFriendRequestReceivedIds().remove(friendRequest.getId());

        userRepository.save(sender);
        userRepository.save(receiver);

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("requestId", requestId);
            notificationData.put("fromUserId", receiver.getId());
            notificationData.put("firstName", receiver.getFirstName());
            notificationData.put("lastName", receiver.getLastName());
            notificationData.put("email", receiver.getEmail());
            notificationData.put("profilePictureUrl", receiver.getProfilePictureUrl() != null ? receiver.getProfilePictureUrl() : "");

            String senderMessage = "Votre demande d'ami a été acceptée par " + receiver.getFirstName() + " " + receiver.getLastName();
            chatWebSocketHandler.sendNotification(sender.getId(), "friend_request_accepted", senderMessage, notificationData);
            persistNotification(sender.getId(), "friend_request_accepted", senderMessage, notificationData);

            notificationData.put("fromUserId", sender.getId());
            notificationData.put("firstName", sender.getFirstName());
            notificationData.put("lastName", sender.getLastName());
            notificationData.put("email", sender.getEmail());
            notificationData.put("profilePictureUrl", sender.getProfilePictureUrl() != null ? sender.getProfilePictureUrl() : "");
            String receiverMessage = "Vous avez accepté la demande d'ami de " + sender.getFirstName() + " " + sender.getLastName();
            chatWebSocketHandler.sendNotification(receiver.getId(), "friend_request_accepted", receiverMessage, notificationData);
            persistNotification(receiver.getId(), "friend_request_accepted", receiverMessage, notificationData);

            System.out.println("📢 Notifications envoyées et persistantées pour acceptFriendRequest (requestId: " + requestId + ")");
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi des notifications pour acceptFriendRequest : " + e.getMessage());
        }

        return mapToDTO(friendRequest);
    }

    public void acceptFriendRequestByIds(String userId, String friendId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId));

        Optional<String> requestIdOpt = user.getFriendRequestReceivedIds().stream()
                .filter(requestId -> {
                    Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
                    return requestOpt.isPresent() &&
                            requestOpt.get().getSender().getId().equals(friendId) &&
                            requestOpt.get().getStatus().equals("PENDING");
                })
                .findFirst();

        if (requestIdOpt.isEmpty()) {
            throw new IllegalArgumentException("Demande d'ami non trouvée ou déjà traitée.");
        }

        acceptFriendRequest(requestIdOpt.get());
    }

    public FriendRequestDTO rejectFriendRequest(String requestId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Demande d'ami introuvable : " + requestId));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!friendRequest.getReceiver().getId().equals(currentUserId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à rejeter cette demande d'ami.");
        }

        if (!friendRequest.getStatus().equals("PENDING")) {
            throw new IllegalStateException("La demande d'ami n'est pas en attente. Statut actuel : " + friendRequest.getStatus());
        }

        friendRequest.setStatus("REJECTED");
        friendRequest.setUpdatedAt(LocalDateTime.now());
        friendRequest = friendRequestRepository.save(friendRequest);

        User sender = friendRequest.getSender();
        User receiver = friendRequest.getReceiver();

        sender.getFriendRequestSentIds().remove(friendRequest.getId());
        receiver.getFriendRequestReceivedIds().remove(friendRequest.getId());
        userRepository.save(sender);
        userRepository.save(receiver);

        try {
            // Notification pour le sender
            Map<String, String> senderNotificationData = new HashMap<>();
            senderNotificationData.put("requestId", requestId);
            senderNotificationData.put("fromUserId", receiver.getId());
            senderNotificationData.put("toUserId", sender.getId()); // Ajout de toUserId
            senderNotificationData.put("firstName", receiver.getFirstName());
            senderNotificationData.put("lastName", receiver.getLastName());
            senderNotificationData.put("email", receiver.getEmail());
            senderNotificationData.put("profilePictureUrl", receiver.getProfilePictureUrl() != null ? receiver.getProfilePictureUrl() : "");

            String senderMessage = "Votre demande d'ami a été refusée par " + receiver.getFirstName() + " " + receiver.getLastName();
            chatWebSocketHandler.sendNotification(sender.getId(), "friend_request_rejected", senderMessage, senderNotificationData);
            persistNotification(sender.getId(), "friend_request_rejected", senderMessage, senderNotificationData);

            // Notification pour le receiver
            Map<String, String> receiverNotificationData = new HashMap<>();
            receiverNotificationData.put("requestId", requestId);
            receiverNotificationData.put("fromUserId", sender.getId());
            receiverNotificationData.put("toUserId", receiver.getId()); // Ajout de toUserId
            receiverNotificationData.put("firstName", sender.getFirstName());
            receiverNotificationData.put("lastName", sender.getLastName());
            receiverNotificationData.put("email", sender.getEmail());
            receiverNotificationData.put("profilePictureUrl", sender.getProfilePictureUrl() != null ? sender.getProfilePictureUrl() : "");
            String receiverMessage = "Vous avez refusé la demande d'ami de " + sender.getFirstName() + " " + sender.getLastName();
            chatWebSocketHandler.sendNotification(receiver.getId(), "friend_request_rejected", receiverMessage, receiverNotificationData);
            persistNotification(receiver.getId(), "friend_request_rejected", receiverMessage, receiverNotificationData);

            System.out.println("📢 Notifications envoyées et persistantées pour rejectFriendRequest (requestId: " + requestId + ")");
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi des notifications pour rejectFriendRequest : " + e.getMessage());
        }

        return mapToDTO(friendRequest);
    }

    public void rejectFriendRequestByIds(String userId, String friendId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId));

        Optional<String> requestIdOpt = user.getFriendRequestReceivedIds().stream()
                .filter(requestId -> {
                    Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
                    return requestOpt.isPresent() &&
                            requestOpt.get().getSender().getId().equals(friendId) &&
                            requestOpt.get().getStatus().equals("PENDING");
                })
                .findFirst();

        if (requestIdOpt.isEmpty()) {
            throw new IllegalArgumentException("Demande d'ami non trouvée ou déjà traitée.");
        }

        rejectFriendRequest(requestIdOpt.get());
    }

    public FriendRequestDTO cancelFriendRequest(String requestId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Demande d'ami introuvable : " + requestId));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!friendRequest.getSender().getId().equals(currentUserId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à annuler cette demande d'ami.");
        }

        if (!friendRequest.getStatus().equals("PENDING")) {
            throw new IllegalStateException("La demande d'ami n'est pas en attente. Statut actuel : " + friendRequest.getStatus());
        }

        friendRequest.setStatus("CANCELED");
        friendRequest.setUpdatedAt(LocalDateTime.now());
        friendRequest = friendRequestRepository.save(friendRequest);

        User sender = friendRequest.getSender();
        User receiver = friendRequest.getReceiver();

        sender.getFriendRequestSentIds().remove(friendRequest.getId());
        receiver.getFriendRequestReceivedIds().remove(friendRequest.getId());
        userRepository.save(sender);
        userRepository.save(receiver);

        try {
            // Notification pour le sender
            Map<String, String> senderNotificationData = new HashMap<>();
            senderNotificationData.put("requestId", requestId);
            senderNotificationData.put("fromUserId", sender.getId());
            senderNotificationData.put("toUserId", receiver.getId()); // Ajout de toUserId
            senderNotificationData.put("firstName", sender.getFirstName());
            senderNotificationData.put("lastName", sender.getLastName());
            senderNotificationData.put("email", sender.getEmail());
            senderNotificationData.put("profilePictureUrl", sender.getProfilePictureUrl() != null ? sender.getProfilePictureUrl() : "");

            String senderMessage = "Vous avez annulé votre demande d'ami envers " + receiver.getFirstName() + " " + receiver.getLastName();
            chatWebSocketHandler.sendNotification(sender.getId(), "friend_request_canceled", senderMessage, senderNotificationData);
            persistNotification(sender.getId(), "friend_request_canceled", senderMessage, senderNotificationData);

            // Notification pour le receiver
            Map<String, String> receiverNotificationData = new HashMap<>();
            receiverNotificationData.put("requestId", requestId);
            receiverNotificationData.put("fromUserId", sender.getId()); // Corriger ici : fromUserId doit être sender
            receiverNotificationData.put("toUserId", receiver.getId()); // Ajout de toUserId
            receiverNotificationData.put("firstName", sender.getFirstName());
            receiverNotificationData.put("lastName", sender.getLastName());
            receiverNotificationData.put("email", sender.getEmail());
            receiverNotificationData.put("profilePictureUrl", sender.getProfilePictureUrl() != null ? sender.getProfilePictureUrl() : "");
            String receiverMessage = sender.getFirstName() + " " + sender.getLastName() + " a annulé sa demande d’ami.";
            chatWebSocketHandler.sendNotification(receiver.getId(), "friend_request_canceled", receiverMessage, receiverNotificationData);
            persistNotification(receiver.getId(), "friend_request_canceled", receiverMessage, receiverNotificationData);

            System.out.println("📢 Notifications envoyées et persistantées pour cancelFriendRequest (requestId: " + requestId + ")");
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi des notifications pour cancelFriendRequest : " + e.getMessage());
        }

        return mapToDTO(friendRequest);
    }

    public void cancelFriendRequestByIds(String senderId, String receiverId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur expéditeur introuvable : " + senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur destinataire introuvable : " + receiverId));

        Optional<FriendRequest> friendRequestOpt = friendRequestRepository.findBySenderIdAndReceiverIdAndStatus(senderId, receiverId, "PENDING");
        if (friendRequestOpt.isEmpty()) {
            System.out.println("⚠️ Aucune demande PENDING trouvée pour sender: " + senderId + ", receiver: " + receiverId + ". Vérifiez les friendRequestSentIds et friendRequestReceivedIds.");
            throw new IllegalArgumentException("Demande d'ami non trouvée ou déjà traitée.");
        }

        cancelFriendRequest(friendRequestOpt.get().getId());
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

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("friendId", friendId);
            notificationData.put("fromUserId", user.getId());
            notificationData.put("firstName", user.getFirstName());
            notificationData.put("lastName", user.getLastName());
            notificationData.put("email", user.getEmail());
            notificationData.put("profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "");

            String messageToUser = "Vous avez supprimé " + friend.getFirstName() + " " + friend.getLastName() + " de votre liste d'amis.";
            chatWebSocketHandler.sendNotification(userId, "friend_removed", messageToUser, notificationData);
            persistNotification(userId, "friend_removed", messageToUser, notificationData);

            notificationData.put("friendId", userId);
            notificationData.put("fromUserId", friend.getId());
            notificationData.put("firstName", friend.getFirstName());
            notificationData.put("lastName", friend.getLastName());
            notificationData.put("email", friend.getEmail());
            notificationData.put("profilePictureUrl", friend.getProfilePictureUrl() != null ? friend.getProfilePictureUrl() : "");
            String messageToFriend = user.getFirstName() + " " + user.getLastName() + " vous a supprimé de sa liste d'amis.";
            chatWebSocketHandler.sendNotification(friendId, "friend_removed", messageToFriend, notificationData);
            persistNotification(friendId, "friend_removed", messageToFriend, notificationData);

            System.out.println("📢 Notifications envoyées et persistantées pour removeFriend (userId: " + userId + ", friendId: " + friendId + ")");
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi des notifications pour removeFriend : " + e.getMessage());
        }
    }

    public List<User> getFriends(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return user.getFriendIds().stream()
                .map(friendId -> userRepository.findById(friendId)
                        .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId)))
                .collect(Collectors.toList());
    }

    public List<User> getSentFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return user.getFriendRequestSentIds().stream()
                .map(requestId -> friendRequestRepository.findById(requestId)
                        .orElseThrow(() -> new IllegalArgumentException("Demande d'ami introuvable : " + requestId)))
                .filter(request -> "PENDING".equals(request.getStatus()))
                .map(FriendRequest::getReceiver)
                .collect(Collectors.toList());
    }

    public List<User> getReceivedFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return user.getFriendRequestReceivedIds().stream()
                .map(requestId -> friendRequestRepository.findById(requestId)
                        .orElseThrow(() -> new IllegalArgumentException("Demande d'ami introuvable : " + requestId)))
                .filter(request -> "PENDING".equals(request.getStatus()))
                .map(FriendRequest::getSender)
                .collect(Collectors.toList());
    }

    private FriendRequestDTO mapToDTO(FriendRequest friendRequest) {
        return FriendRequestDTO.builder()
                .id(friendRequest.getId())
                .senderId(friendRequest.getSender().getId())
                .receiverId(friendRequest.getReceiver().getId())
                .firstName(friendRequest.getSender().getFirstName())
                .lastName(friendRequest.getSender().getLastName())
                .email(friendRequest.getSender().getEmail())
                .profilePictureUrl(friendRequest.getSender().getProfilePictureUrl())
                .status(friendRequest.getStatus())
                .createdAt(friendRequest.getCreatedAt())
                .updatedAt(friendRequest.getUpdatedAt())
                .build();
    }

    private void persistNotification(String userId, String notificationType, String message, Map<String, String> data) {
        try {
            Notification notification = Notification.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
                    .type(notificationType)
                    .message(message)
                    .timestamp(Instant.now())
                    .isRead(false)
                    .data(data != null ? data : new HashMap<>())
                    .build();
            notificationRepository.save(notification);
            System.out.println("💾 Notification persistantée pour " + userId + ": " + message);
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la persistance de la notification pour " + userId + ": " + e.getMessage());
        }
    }
}