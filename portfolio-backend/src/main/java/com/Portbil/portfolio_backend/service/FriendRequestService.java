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

        if (friendRequestRepository.existsBySenderAndReceiverAndStatus(sender, receiver, "PENDING")) {
            throw new IllegalStateException("Une demande d'ami en attente existe déjà entre ces utilisateurs.");
        }

        if (sender.getFriendIds().contains(receiverId) || receiver.getFriendIds().contains(senderId)) {
            throw new IllegalStateException("Ces utilisateurs sont déjà amis.");
        }

        FriendRequest friendRequest = FriendRequest.builder()
                .id(UUID.randomUUID().toString()) // Générer un ID unique
                .sender(sender)
                .receiver(receiver)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        friendRequest = friendRequestRepository.save(friendRequest);

        sender.getFriendRequestSentIds().add(friendRequest.getId());
        receiver.getFriendRequestReceivedIds().add(friendRequest.getId());
        userRepository.save(sender);
        userRepository.save(receiver);

        try {
            Map<String, String> notificationData = new HashMap<>();
            String requestId = friendRequest.getId();
            notificationData.put("requestId", requestId);
            notificationData.put("fromUserId", senderId);

            String receiverMessage = "Nouvelle demande d'ami reçue de " + sender.getFirstName() + " " + sender.getLastName();
            chatWebSocketHandler.sendNotification(receiverId, "friend_request_received", receiverMessage, notificationData);
            persistNotification(receiverId, "friend_request_received", receiverMessage, notificationData);

            String senderMessage = "Demande d'ami envoyée avec succès à " + receiver.getFirstName() + " " + receiver.getLastName();
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

            String senderMessage = "Votre demande d'ami a été acceptée par " + receiver.getFirstName() + " " + receiver.getLastName();
            chatWebSocketHandler.sendNotification(sender.getId(), "friend_request_accepted", senderMessage, notificationData);
            persistNotification(sender.getId(), "friend_request_accepted", senderMessage, notificationData);

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

        // Trouver la demande d'ami dans friendRequestReceivedIds de l'utilisateur
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
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("requestId", requestId);

            String senderMessage = "Votre demande d'ami a été refusée par " + receiver.getFirstName() + " " + receiver.getLastName();
            chatWebSocketHandler.sendNotification(sender.getId(), "friend_request_rejected", senderMessage, notificationData);
            persistNotification(sender.getId(), "friend_request_rejected", senderMessage, notificationData);

            String receiverMessage = "Vous avez refusé la demande d'ami de " + sender.getFirstName() + " " + sender.getLastName();
            chatWebSocketHandler.sendNotification(receiver.getId(), "friend_request_rejected", receiverMessage, notificationData);
            persistNotification(receiver.getId(), "friend_request_rejected", receiverMessage, notificationData);

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

        // Trouver la demande d'ami dans friendRequestReceivedIds de l'utilisateur
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
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("requestId", requestId);

            String senderMessage = "Vous avez annulé votre demande d'ami envers " + receiver.getFirstName() + " " + receiver.getLastName();
            chatWebSocketHandler.sendNotification(sender.getId(), "friend_request_canceled", senderMessage, notificationData);
            persistNotification(sender.getId(), "friend_request_canceled", senderMessage, notificationData);

            String receiverMessage = sender.getFirstName() + " " + sender.getLastName() + " a annulé sa demande d’ami.";
            chatWebSocketHandler.sendNotification(receiver.getId(), "friend_request_canceled", receiverMessage, notificationData);
            persistNotification(receiver.getId(), "friend_request_canceled", receiverMessage, notificationData);

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

        Optional<FriendRequest> friendRequestOpt = friendRequestRepository.findBySenderAndReceiverAndStatus(sender, receiver, "PENDING");
        if (friendRequestOpt.isEmpty()) {
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

            String messageToUser = "Vous avez supprimé " + friend.getFirstName() + " " + friend.getLastName() + " de votre liste d'amis.";
            chatWebSocketHandler.sendNotification(userId, "friendship_removed", messageToUser, notificationData);
            persistNotification(userId, "friendship_removed", messageToUser, notificationData);

            String messageToFriend = user.getFirstName() + " " + user.getLastName() + " vous a supprimé de sa liste d'amis.";
            chatWebSocketHandler.sendNotification(friendId, "friendship_removed", messageToFriend, notificationData);
            persistNotification(friendId, "friendship_removed", messageToFriend, notificationData);

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