package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Message;
import com.Portbil.portfolio_backend.entity.MessageHistory;
import com.Portbil.portfolio_backend.repository.MessageHistoryRepository;
import com.Portbil.portfolio_backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ChatHistoryService {

    @Autowired
    private MessageHistoryRepository messageHistoryRepository;

    @Autowired
    private MessageRepository messageRepository;

    // Ajouter ou mettre à jour un message dans l'historique
    public void recordMessageAction(Message message, String action) {
        // Trouver ou créer l'entrée MessageHistory pour ce chatId
        MessageHistory history = messageHistoryRepository.findByChatId(message.getChatId());
        if (history == null) {
            history = MessageHistory.builder()
                    .chatId(message.getChatId())
                    .fromUserId(message.getFromUserId())
                    .toUserId(message.getToUserId())
                    .messages(new ArrayList<>())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
        } else {
            history.setUpdatedAt(Instant.now());
        }

        // Vérifier si le message existe déjà dans l'historique
        Optional<MessageHistory.MessageEntry> existingEntry = history.getMessages().stream()
                .filter(entry -> entry.getMessageId().equals(message.getId()))
                .findFirst();

        if (existingEntry.isPresent()) {
            MessageHistory.MessageEntry entry = existingEntry.get();
            // Ajouter une nouvelle version à l'historique
            entry.getHistory().add(MessageHistory.MessageVersion.builder()
                    .timestamp(Instant.now())
                    .action(action)
                    .content(message.getContent())
                    .build());
            // Mettre à jour le contenu et l'état supprimé
            entry.setContent(message.getContent());
            entry.setIsDeleted(message.isDeleted());
        } else {
            // Créer une nouvelle entrée pour le message
            MessageHistory.MessageEntry entry = MessageHistory.MessageEntry.builder()
                    .messageId(message.getId())
                    .content(message.getContent())
                    .isDeleted(message.isDeleted())
                    .fromUserId(message.getFromUserId())
                    .toUserId(message.getToUserId())
                    .timestamp(message.getTimestamp())
                    .history(new ArrayList<>(List.of(MessageHistory.MessageVersion.builder()
                            .timestamp(Instant.now())
                            .action(action)
                            .content(message.getContent())
                            .build())))
                    .build();
            history.getMessages().add(entry);
        }

        // Sauvegarder l'historique
        messageHistoryRepository.save(history);
        System.out.println("📜 Historique mis à jour pour chatId: " + message.getChatId());
    }

    // Initialiser l'historique pour les messages existants (alternative à @PostConstruct)
    @EventListener(ContextRefreshedEvent.class)
    public void initializeMessageHistory() {
        List<String> chatIds = messageRepository.findAll().stream()
                .map(Message::getChatId)
                .distinct()
                .toList();

        for (String chatId : chatIds) {
            if (messageHistoryRepository.findByChatId(chatId) == null) {
                List<Message> messages = messageRepository.findByChatId(chatId);
                if (!messages.isEmpty()) {
                    MessageHistory history = MessageHistory.builder()
                            .chatId(chatId)
                            .fromUserId(messages.get(0).getFromUserId())
                            .toUserId(messages.get(0).getToUserId())
                            .messages(new ArrayList<>())
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();

                    for (Message message : messages) {
                        MessageHistory.MessageEntry entry = MessageHistory.MessageEntry.builder()
                                .messageId(message.getId())
                                .content(message.getContent())
                                .isDeleted(message.isDeleted())
                                .fromUserId(message.getFromUserId())
                                .toUserId(message.getToUserId())
                                .timestamp(message.getTimestamp())
                                .history(new ArrayList<>(List.of(MessageHistory.MessageVersion.builder()
                                        .timestamp(message.getTimestamp())
                                        .action("CREATED")
                                        .content(message.getContent())
                                        .build())))
                                .build();
                        history.getMessages().add(entry);
                    }

                    messageHistoryRepository.save(history);
                    System.out.println("📜 Historique initialisé pour chatId: " + chatId);
                }
            }
        }
    }
}