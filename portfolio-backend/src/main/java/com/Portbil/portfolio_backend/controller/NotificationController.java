package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.NotificationDTO;
import com.Portbil.portfolio_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationDTO>> getNotifications(@PathVariable String userId, Authentication authentication) {
        if (!authentication.getName().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        List<NotificationDTO> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String notificationId, Authentication authentication) {
        NotificationDTO notification = notificationService.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification introuvable : " + notificationId));
        if (!authentication.getName().equals(notification.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteAllNotifications(@PathVariable String userId, Authentication authentication) {
        if (!authentication.getName().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        notificationService.deleteAllNotifications(userId);
        return ResponseEntity.ok().build();
    }

    // Nouvelle méthode pour supprimer une notification spécifique
    @DeleteMapping("/{userId}/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String userId,
            @PathVariable String notificationId,
            Authentication authentication) {
        if (!authentication.getName().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        NotificationDTO notification = notificationService.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification introuvable : " + notificationId));
        if (!notification.getUserId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok().build();
    }
}