package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.MessageHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageHistoryRepository extends MongoRepository<MessageHistory, String> {

    // Trouver l'historique d'une conversation par chatId
    MessageHistory findByChatId(String chatId);
}