package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.FriendRequest;
import com.Portbil.portfolio_backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends MongoRepository<FriendRequest, String> {

    // Trouver toutes les demandes d'amis en attente reçues par un utilisateur
    List<FriendRequest> findByReceiverAndStatus(User receiver, String status);

    // Trouver toutes les demandes d'amis envoyées par un utilisateur
    List<FriendRequest> findBySenderAndStatus(User sender, String status);

    // Vérifier si une demande existe entre deux utilisateurs
    boolean existsBySenderAndReceiverAndStatus(User sender, User receiver, String status);

    // Nouvelle méthode pour rechercher par IDs directement
    @Query("{ 'sender._id': ?0, 'receiver._id': ?1, 'status': ?2 }")
    Optional<FriendRequest> findBySenderIdAndReceiverIdAndStatus(String senderId, String receiverId, String status);
}