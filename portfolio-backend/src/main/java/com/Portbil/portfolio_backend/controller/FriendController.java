package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.FriendRequestDTO;
import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.FriendRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendRequestService friendRequestService;

    /**
     * Envoyer une demande d'ami
     */
    @PostMapping("/request/{senderId}/{receiverId}")
    public ResponseEntity<String> sendFriendRequest(
            @PathVariable String senderId,
            @PathVariable String receiverId) {
        friendRequestService.sendFriendRequest(senderId, receiverId);
        return ResponseEntity.ok("Demande d'ami envoyée avec succès.");
    }

    /**
     * Accepter une demande d'ami
     */
    @PostMapping("/accept/{userId}/{friendId}")
    public ResponseEntity<String> acceptFriendRequest(
            @PathVariable String userId,
            @PathVariable String friendId) {
        friendRequestService.acceptFriendRequestByIds(userId, friendId);
        return ResponseEntity.ok("Demande d'ami acceptée avec succès.");
    }

    /**
     * Refuser une demande d'ami
     */
    @PostMapping("/reject/{userId}/{friendId}")
    public ResponseEntity<String> rejectFriendRequest(
            @PathVariable String userId,
            @PathVariable String friendId) {
        friendRequestService.rejectFriendRequestByIds(userId, friendId);
        return ResponseEntity.ok("Demande d'ami refusée avec succès.");
    }

    /**
     * Supprimer un ami
     */
    @DeleteMapping("/remove/{userId}/{friendId}")
    public ResponseEntity<String> removeFriend(
            @PathVariable String userId,
            @PathVariable String friendId) {
        friendRequestService.removeFriend(userId, friendId);
        return ResponseEntity.ok("Ami supprimé avec succès.");
    }

    /**
     * Annuler une demande d'ami envoyée
     */
    @DeleteMapping("/cancel/{senderId}/{receiverId}")
    public ResponseEntity<String> cancelFriendRequest(
            @PathVariable String senderId,
            @PathVariable String receiverId) {
        friendRequestService.cancelFriendRequestByIds(senderId, receiverId);
        return ResponseEntity.ok("Demande d'ami annulée avec succès.");
    }

    /**
     * Récupérer la liste des amis d'un utilisateur
     */
    @GetMapping("/{userId}/list")
    public ResponseEntity<List<UserDTO>> getFriends(@PathVariable String userId) {
        List<User> friends = friendRequestService.getFriends(userId);
        List<UserDTO> friendDTOs = friends.stream().map(user -> UserDTO.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .profilePictureUrl(user.getProfilePictureUrl()) // Utilisation correcte
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(friendDTOs);
    }

    /**
     * Récupérer les demandes d'amis envoyées
     */
    @GetMapping("/{userId}/sent")
    public ResponseEntity<List<UserDTO>> getSentFriendRequests(@PathVariable String userId) {
        List<User> sentRequests = friendRequestService.getSentFriendRequests(userId);
        List<UserDTO> sentRequestDTOs = sentRequests.stream().map(user -> UserDTO.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .profilePictureUrl(user.getProfilePictureUrl()) // Utilisation correcte
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(sentRequestDTOs);
    }

    /**
     * Récupérer les demandes d'amis reçues
     */
    @GetMapping("/{userId}/received")
    public ResponseEntity<List<UserDTO>> getReceivedFriendRequests(@PathVariable String userId) {
        List<User> receivedRequests = friendRequestService.getReceivedFriendRequests(userId);
        List<UserDTO> receivedRequestDTOs = receivedRequests.stream().map(user -> UserDTO.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .profilePictureUrl(user.getProfilePictureUrl()) // Utilisation correcte
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(receivedRequestDTOs);
    }
}