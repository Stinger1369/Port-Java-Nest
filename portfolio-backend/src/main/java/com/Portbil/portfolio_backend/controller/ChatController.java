package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.entity.Message;
import com.Portbil.portfolio_backend.entity.Report;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.MessageRepository;
import com.Portbil.portfolio_backend.repository.ReportRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException; // Import ajouté
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap; // Import ajouté
import java.util.List;
import java.util.Map; // Import ajouté
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;
    private final String DEVELOPER_ID = "developer-id-here";

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

    // Récupérer les messages privés avec un autre utilisateur ou initialiser une conversation
    @GetMapping("/private/{otherUserId}")
    public ResponseEntity<List<Message>> getPrivateMessages(@PathVariable String otherUserId, Authentication authentication) {
        String currentUserId = authentication.getName();
        User currentUser = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        User otherUser = userRepository.findById(otherUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        // Trouver le chatId commun ou en créer un nouveau
        List<String> commonChatIds = currentUser.getChatIds().stream()
                .filter(chatId -> otherUser.getChatIds().contains(chatId))
                .toList();

        String chatId;
        if (commonChatIds.isEmpty()) {
            // Générer un nouveau chatId pour une nouvelle conversation
            chatId = UUID.randomUUID().toString();
            List<String> currentUserChatIds = new ArrayList<>(currentUser.getChatIds());
            List<String> otherUserChatIds = new ArrayList<>(otherUser.getChatIds());
            currentUserChatIds.add(chatId);
            otherUserChatIds.add(chatId);
            currentUser.setChatIds(currentUserChatIds);
            otherUser.setChatIds(otherUserChatIds);
            userRepository.save(currentUser);
            userRepository.save(otherUser);
            System.out.println("🆕 Nouvelle conversation créée avec chatId: " + chatId + " entre " + currentUserId + " et " + otherUserId);
        } else {
            chatId = commonChatIds.get(0); // Utiliser le premier chatId commun
        }

        List<Message> messages = messageRepository.findByChatId(chatId);
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
    // Récupérer tous les signalements (pour l'admin uniquement)
    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getAllReports(Authentication authentication) {
        String currentUserId = authentication.getName();
        if (!currentUserId.equals(DEVELOPER_ID)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        List<Report> reports = reportRepository.findByStatus("PENDING");
        System.out.println("📋 Signalements récupérés pour l'admin: " + reports);
        return ResponseEntity.ok(reports);
    }

    // Marquer un signalement comme traité
    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<Report> resolveReport(@PathVariable String id, Authentication authentication) {
        String currentUserId = authentication.getName();
        if (!currentUserId.equals(DEVELOPER_ID)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Report report = reportOpt.get();
        report.setStatus("RESOLVED");
        Report updatedReport = reportRepository.save(report);

        // Notifier le reporter via WebSocket
        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("reportId", id);
            notificationData.put("reportedId", report.getReportedId());
            chatWebSocketHandler.sendNotification(
                    report.getReporterId(),
                    "report_resolved",
                    "Votre signalement de " + report.getReportedId() + " a été traité par l'administrateur.",
                    notificationData
            );
            chatWebSocketHandler.persistNotification(
                    report.getReporterId(),
                    "report_resolved",
                    "Votre signalement de " + report.getReportedId() + " a été traité par l'administrateur.",
                    notificationData
            );
        } catch (IOException e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification WebSocket au reporter : " + e.getMessage());
        }

        System.out.println("✅ Signalement " + id + " marqué comme résolu");
        return ResponseEntity.ok(updatedReport);
    }
}
