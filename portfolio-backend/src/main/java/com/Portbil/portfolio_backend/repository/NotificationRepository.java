package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserId(String userId);
    void deleteByUserId(String userId); // Ajout de cette méthode (à implémenter via MongoDB)
}