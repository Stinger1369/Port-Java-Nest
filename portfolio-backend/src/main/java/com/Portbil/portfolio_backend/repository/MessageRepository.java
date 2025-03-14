package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    // Trouver les messages par une liste de chatIds
    List<Message> findByChatIdIn(List<String> chatIds);

    // Trouver les messages non supprimés par une liste de chatIds
    @Query("{ 'chatId': { $in: ?0 }, 'isDeleted': false }")
    List<Message> findByChatIdInAndIsDeletedFalse(List<String> chatIds);

    // Trouver les messages par chatId
    List<Message> findByChatId(String chatId);

    // Trouver les messages non supprimés par chatId
    @Query("{ 'chatId': ?0, 'isDeleted': false }")
    List<Message> findByChatIdAndIsDeletedFalse(String chatId);

    // Trouver les messages privés entre deux utilisateurs
    List<Message> findByTypeAndFromUserIdAndToUserId(String type, String fromUserId, String toUserId);
}