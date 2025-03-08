package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.NotificationDTO;
import com.Portbil.portfolio_backend.entity.Notification;
import com.Portbil.portfolio_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationDTO> getNotificationsByUserId(String userId) {
        return notificationRepository.findByUserId(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Optional<NotificationDTO> findById(String notificationId) {
        return notificationRepository.findById(notificationId)
                .map(this::mapToDTO);
    }

    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification introuvable : " + notificationId));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void deleteAllNotifications(String userId) {
        notificationRepository.deleteByUserId(userId); // Supposons que cette méthode existe ou soit ajoutée dans NotificationRepository
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .message(notification.getMessage())
                .timestamp(notification.getTimestamp())
                .isRead(notification.isRead())
                .data(notification.getData())
                .build();
    }
}