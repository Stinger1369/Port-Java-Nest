package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.FriendRequestDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final UserService userService;

    /**
     * Envoyer une demande d'ami
     */
    @PostMapping("/request/{senderId}/{receiverId}")
    public ResponseEntity<String> sendFriendRequest(
            @PathVariable String senderId,
            @PathVariable String receiverId) {
        userService.sendFriendRequest(senderId, receiverId);
        return ResponseEntity.ok("Demande d'ami envoyée avec succès.");
    }

    /**
     * Accepter une demande d'ami
     */
    @PostMapping("/accept/{userId}/{friendId}")
    public ResponseEntity<String> acceptFriendRequest(
            @PathVariable String userId,
            @PathVariable String friendId) {
        userService.acceptFriendRequest(userId, friendId);
        return ResponseEntity.ok("Demande d'ami acceptée avec succès.");
    }

    /**
     * Refuser une demande d'ami
     */
    @PostMapping("/reject/{userId}/{friendId}")
    public ResponseEntity<String> rejectFriendRequest(
            @PathVariable String userId,
            @PathVariable String friendId) {
        userService.rejectFriendRequest(userId, friendId);
        return ResponseEntity.ok("Demande d'ami refusée avec succès.");
    }

    /**
     * Supprimer un ami
     */
    @DeleteMapping("/remove/{userId}/{friendId}")
    public ResponseEntity<String> removeFriend(
            @PathVariable String userId,
            @PathVariable String friendId) {
        userService.removeFriend(userId, friendId);
        return ResponseEntity.ok("Ami supprimé avec succès.");
    }

    /**
     * Annuler une demande d'ami envoyée
     */
    @DeleteMapping("/cancel/{senderId}/{receiverId}")
    public ResponseEntity<String> cancelFriendRequest(
            @PathVariable String senderId,
            @PathVariable String receiverId) {
        userService.cancelFriendRequest(senderId, receiverId);
        return ResponseEntity.ok("Demande d'ami annulée avec succès.");
    }

    /**
     * Récupérer la liste des amis d'un utilisateur
     */
    @GetMapping("/{userId}/list")
    public ResponseEntity<List<FriendRequestDTO>> getFriends(@PathVariable String userId) {
        List<User> friends = userService.getFriends(userId);
        List<FriendRequestDTO> friendDTOs = friends.stream().map(user -> FriendRequestDTO.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .profilePictureUrl(user.getProfilePictureUrl())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(friendDTOs);
    }

    /**
     * Récupérer les demandes d'amis envoyées
     */
    @GetMapping("/{userId}/sent")
    public ResponseEntity<List<FriendRequestDTO>> getSentFriendRequests(@PathVariable String userId) {
        List<User> sentRequests = userService.getSentFriendRequests(userId);
        List<FriendRequestDTO> sentRequestDTOs = sentRequests.stream().map(user -> FriendRequestDTO.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .profilePictureUrl(user.getProfilePictureUrl())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(sentRequestDTOs);
    }

    /**
     * Récupérer les demandes d'amis reçues
     */
    @GetMapping("/{userId}/received")
    public ResponseEntity<List<FriendRequestDTO>> getReceivedFriendRequests(@PathVariable String userId) {
        List<User> receivedRequests = userService.getReceivedFriendRequests(userId);
        List<FriendRequestDTO> receivedRequestDTOs = receivedRequests.stream().map(user -> FriendRequestDTO.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .profilePictureUrl(user.getProfilePictureUrl())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(receivedRequestDTOs);
    }
}