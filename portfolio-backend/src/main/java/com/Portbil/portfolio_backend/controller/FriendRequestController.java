package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.FriendRequestDTO;
import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.FriendRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friend-requests")
public class FriendRequestController {

    @Autowired
    private FriendRequestService friendRequestService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/send")
    public ResponseEntity<FriendRequestDTO> sendFriendRequest(
            @RequestParam String senderId,
            @RequestParam String receiverId) {
        try {
            FriendRequestDTO friendRequestDTO = friendRequestService.sendFriendRequest(senderId, receiverId);
            return ResponseEntity.ok(friendRequestDTO);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/accept/{requestId}")
    public ResponseEntity<FriendRequestDTO> acceptFriendRequest(@PathVariable String requestId) {
        try {
            FriendRequestDTO friendRequestDTO = friendRequestService.acceptFriendRequest(requestId);
            System.out.println("✅ Friend request accepted: " + requestId);
            return ResponseEntity.ok(friendRequestDTO);
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Bad Request: " + e.getMessage());
            return ResponseEntity.badRequest().body(null); // 400
        } catch (SecurityException e) {
            System.out.println("❌ Forbidden: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null); // 403
        } catch (IllegalStateException e) {
            System.out.println("❌ Bad Request (state): " + e.getMessage());
            return ResponseEntity.badRequest().body(null); // 400
        } catch (Exception e) {
            System.err.println("❌ Internal Server Error in acceptFriendRequest: " + e.getMessage());
            e.printStackTrace(); // Log complet pour déboguer
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null); // 500
        }
    }

    @PutMapping("/reject/{requestId}")
    public ResponseEntity<FriendRequestDTO> rejectFriendRequest(@PathVariable String requestId) {
        try {
            FriendRequestDTO friendRequestDTO = friendRequestService.rejectFriendRequest(requestId);
            return ResponseEntity.ok(friendRequestDTO);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/cancel/{requestId}")
    public ResponseEntity<FriendRequestDTO> cancelFriendRequest(@PathVariable String requestId) {
        try {
            FriendRequestDTO friendRequestDTO = friendRequestService.cancelFriendRequest(requestId);
            return ResponseEntity.ok(friendRequestDTO);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/remove-friend")
    public ResponseEntity<String> removeFriend(
            @RequestParam String userId,
            @RequestParam String friendId) {
        try {
            friendRequestService.removeFriend(userId, friendId);
            return ResponseEntity.ok("Friend removed successfully");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression de l'ami");
        }
    }

    @GetMapping("/pending/received/{userId}")
    public ResponseEntity<List<FriendRequestDTO>> getPendingReceivedFriendRequests(@PathVariable String userId) {
        try {
            List<FriendRequestDTO> requestDTOs = friendRequestService.getPendingReceivedFriendRequests(userId);
            return ResponseEntity.ok(requestDTOs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/pending/sent/{userId}")
    public ResponseEntity<List<FriendRequestDTO>> getPendingSentFriendRequests(@PathVariable String userId) {
        try {
            List<FriendRequestDTO> requestDTOs = friendRequestService.getPendingSentFriendRequests(userId);
            return ResponseEntity.ok(requestDTOs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{userId}/friends")
    public ResponseEntity<List<UserDTO>> getFriends(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
            // Récupérer les amis à partir des friendIds
            List<UserDTO> friends = user.getFriendIds().stream()
                    .map(friendId -> userRepository.findById(friendId)
                            .orElseThrow(() -> new IllegalArgumentException("Ami introuvable : " + friendId)))
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(friends);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .city(user.getCity())
                .country(user.getCountry())
                .sex(user.getSex())
                .slug(user.getSlug())
                .bio(user.getBio())
                .birthdate(user.getBirthdate())
                .showBirthdate(user.isShowBirthdate())
                .age(user.getAge())
                .likedUserIds(user.getLikedUserIds())
                .likerUserIds(user.getLikerUserIds())
                .latitude(user.getLatitude() != null ? user.getLatitude().toString() : null)
                .longitude(user.getLongitude() != null ? user.getLongitude().toString() : null)
                .chatIds(user.getChatIds())
                .build();
    }
}