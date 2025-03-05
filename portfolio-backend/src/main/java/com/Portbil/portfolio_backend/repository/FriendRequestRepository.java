package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.FriendRequest;
import com.Portbil.portfolio_backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendRequestRepository extends MongoRepository<FriendRequest, String> {

    // Trouver toutes les demandes d'amis en attente reçues par un utilisateur
    List<FriendRequest> findByReceiverAndStatus(User receiver, String status);

    // Trouver toutes les demandes d'amis envoyées par un utilisateur
    List<FriendRequest> findBySenderAndStatus(User sender, String status);

    // Vérifier si une demande existe entre deux utilisateurs
    boolean existsBySenderAndReceiverAndStatus(User sender, User receiver, String status);
}