package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {

    // Récupérer l'historique des messages privés entre deux utilisateurs
    List<Message> findByTypeAndFromUserIdAndToUserId(String type, String fromUserId, String toUserId);

    // Récupérer l'historique des messages d'un groupe
    List<Message> findByTypeAndGroupId(String type, String groupId);

    // Récupérer toutes les conversations d’un utilisateur (privées envoyées/reçues + groupe)
    @Query("{'$or': [{'type': 'private', 'fromUserId': ?0}, {'type': 'private', 'toUserId': ?0}, {'type': 'group_message', 'groupId': {$in: ?1}}]}")
    List<Message> findAllConversationsByUserId(String userId, List<String> groupIds);

    // Nouvelles méthodes pour chatId
    @Query("{ 'chatId': ?0 }")
    List<Message> findByChatId(String chatId);

    @Query("{ 'chatId': { $in: ?0 } }")
    List<Message> findByChatIdIn(List<String> chatIds);
}