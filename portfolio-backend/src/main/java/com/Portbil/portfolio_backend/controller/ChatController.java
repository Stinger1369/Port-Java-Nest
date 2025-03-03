package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.entity.Message;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.MessageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    // Récupérer toutes les conversations d’un utilisateur (privées + groupe)
    @GetMapping("/all")
    public ResponseEntity<List<Message>> getAllConversations(Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        List<String> chatIds = user.getChatIds();
        List<Message> messages = messageRepository.findByChatIdIn(chatIds);
        System.out.println("📥 Messages fetched for user " + currentUserId + ": " + messages);
        return ResponseEntity.ok(messages);
    }

    // Récupérer les messages privés avec un autre utilisateur
    @GetMapping("/private/{otherUserId}")
    public ResponseEntity<List<Message>> getPrivateMessages(@PathVariable String otherUserId, Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        User otherUser = userRepository.findById(otherUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        // Trouver le chatId commun
        List<String> commonChatIds = user.getChatIds().stream()
                .filter(chatId -> otherUser.getChatIds().contains(chatId))
                .toList();

        List<Message> messages = messageRepository.findByChatIdIn(commonChatIds);
        System.out.println("📥 Private messages fetched between " + currentUserId + " and " + otherUserId + ": " + messages);
        return ResponseEntity.ok(messages);
    }

    // Récupérer les messages d’un groupe
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Message>> getGroupMessages(@PathVariable String groupId, Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        if (!user.getChatIds().contains(groupId)) {
            return ResponseEntity.status(403).body(null); // Forbidden
        }
        List<Message> messages = messageRepository.findByChatId(groupId);
        System.out.println("📥 Group messages fetched for group " + groupId + ": " + messages);
        return ResponseEntity.ok(messages);
    }

    // Modifier un message
    @PutMapping("/{id}")
    public ResponseEntity<Message> updateMessage(@PathVariable String id, @RequestBody Message updatedMessage, Authentication authentication) {
        String currentUserId = authentication.getName();
        Optional<Message> existingMessageOpt = messageRepository.findById(id);

        if (existingMessageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Message existingMessage = existingMessageOpt.get();
        if (!existingMessage.getFromUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).body(null); // Forbidden
        }

        existingMessage.setContent(updatedMessage.getContent());
        existingMessage.setTimestamp(Instant.now());
        Message savedMessage = messageRepository.save(existingMessage);
        return ResponseEntity.ok(savedMessage);
    }

    // Supprimer un message
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String id, Authentication authentication) {
        String currentUserId = authentication.getName();
        Optional<Message> messageOpt = messageRepository.findById(id);

        if (messageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Message message = messageOpt.get();
        if (!message.getFromUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }

        messageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}