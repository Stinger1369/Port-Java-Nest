package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.dto.FriendRequestDTO;
import com.Portbil.portfolio_backend.entity.FriendRequest;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.FriendRequestRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FriendRequestService {

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

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

        // Vérifier si les utilisateurs sont déjà amis via friendIds
        if (sender.getFriendIds().contains(receiverId) || receiver.getFriendIds().contains(senderId)) {
            throw new IllegalStateException("Ces utilisateurs sont déjà amis.");
        }

        FriendRequest friendRequest = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status("PENDING")
                .build();

        friendRequest = friendRequestRepository.save(friendRequest);

        sender.getFriendRequests().add(friendRequest);
        receiver.getFriendRequests().add(friendRequest);
        userRepository.save(sender);
        userRepository.save(receiver);

        // Envoyer une notification au destinataire via WebSocket
        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("requestId", friendRequest.getId());
            notificationData.put("fromUserId", senderId);
            chatWebSocketHandler.sendNotification(receiverId, "friend_request", "Nouvelle demande d’ami de " + senderId, notificationData);
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification pour la demande d'ami : " + e.getMessage());
        }

        return mapToDTO(friendRequest);
    }

    // Accepter une demande d'ami
    public FriendRequestDTO acceptFriendRequest(String requestId) {
        System.out.println("🔍 Accepting friend request with ID: " + requestId);
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> {
                    System.out.println("❌ Friend request not found: " + requestId);
                    return new IllegalArgumentException("Demande d'ami introuvable : " + requestId);
                });

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        System.out.println("🔍 Current authenticated user: " + currentUserId + ", Receiver ID: " + friendRequest.getReceiver().getId());
        if (!friendRequest.getReceiver().getId().equals(currentUserId)) {
            System.out.println("❌ User " + currentUserId + " is not authorized to accept this request");
            throw new SecurityException("Vous n'êtes pas autorisé à accepter cette demande d'ami.");
        }

        if (!friendRequest.getStatus().equals("PENDING")) {
            System.out.println("❌ Friend request status is not PENDING: " + friendRequest.getStatus());
            throw new IllegalStateException("La demande d'ami n'est pas en attente. Statut actuel : " + friendRequest.getStatus());
        }

        friendRequest.setStatus("ACCEPTED");
        System.out.println("✅ Updating friend request status to ACCEPTED");
        friendRequest = friendRequestRepository.save(friendRequest);

        User sender = friendRequest.getSender();
        User receiver = friendRequest.getReceiver();
        System.out.println("🔍 Adding friendship: " + sender.getId() + " <-> " + receiver.getId());

        // Ajouter les IDs aux listes friendIds
        if (!sender.getFriendIds().contains(receiver.getId())) {
            sender.getFriendIds().add(receiver.getId());
        }
        if (!receiver.getFriendIds().contains(sender.getId())) {
            receiver.getFriendIds().add(sender.getId());
        }

        try {
            userRepository.save(sender);
            userRepository.save(receiver);
            System.out.println("✅ Users updated with new friendship IDs");
        } catch (Exception e) {
            System.err.println("❌ Error saving users: " + e.getMessage());
            throw new RuntimeException("Erreur lors de la mise à jour des utilisateurs : " + e.getMessage(), e);
        }

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("requestId", friendRequest.getId());
            notificationData.put("fromUserId", receiver.getId());
            chatWebSocketHandler.sendNotification(
                    sender.getId(),
                    "friend_request_accepted",
                    "Votre demande d’ami a été acceptée par " + receiver.getId(),
                    notificationData
            );
            System.out.println("✅ Notification sent to sender: " + sender.getId());
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification d'acceptation : " + e.getMessage());
        }

        return mapToDTO(friendRequest);
    }

    // Rejeter une demande d'ami
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
        friendRequest = friendRequestRepository.save(friendRequest);

        return mapToDTO(friendRequest);
    }

    // Annuler une demande d'ami
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
        friendRequest = friendRequestRepository.save(friendRequest);

        return mapToDTO(friendRequest);
    }

    // Supprimer un ami
    public void removeFriend(String userId, String friendId) {
        if (userId == null || userId.isEmpty() || friendId == null || friendId.isEmpty()) {
            throw new IllegalArgumentException("Les identifiants des utilisateurs ne peuvent pas être nuls ou vides.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId));

        // Vérifier si les utilisateurs sont amis via friendIds
        if (!user.getFriendIds().contains(friendId) || !friend.getFriendIds().contains(userId)) {
            throw new IllegalStateException("Ces utilisateurs ne sont pas amis.");
        }

        user.getFriendIds().remove(friendId);
        friend.getFriendIds().remove(userId);
        userRepository.save(user);
        userRepository.save(friend);
    }

    // Récupérer les demandes d'amis en attente reçues
    public List<FriendRequestDTO> getPendingReceivedFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return friendRequestRepository.findByReceiverAndStatus(user, "PENDING")
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Récupérer les demandes d'amis envoyées
    public List<FriendRequestDTO> getPendingSentFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return friendRequestRepository.findBySenderAndStatus(user, "PENDING")
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private FriendRequestDTO mapToDTO(FriendRequest friendRequest) {
        return FriendRequestDTO.builder()
                .id(friendRequest.getId())
                .senderId(friendRequest.getSender().getId())
                .receiverId(friendRequest.getReceiver().getId())
                .status(friendRequest.getStatus())
                .createdAt(friendRequest.getCreatedAt())
                .updatedAt(friendRequest.getUpdatedAt())
                .build();
    }
}