// portfolio-backend/src/main/java/com/Portbil/portfolio_backend/controller/ChatController.java
package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.entity.Message;
import com.Portbil.portfolio_backend.entity.Report;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.MessageRepository;
import com.Portbil.portfolio_backend.repository.ReportRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.service.ChatHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

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

    @Autowired
    private ChatHistoryService chatHistoryService;

    private final String DEVELOPER_ID = "developer-id-here";

    @GetMapping("/all")
    public ResponseEntity<List<Message>> getAllConversations(Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        List<String> chatIds = user.getChatIds();
        List<Message> messages = messageRepository.findByChatIdInAndIsDeletedFalse(chatIds);
        System.out.println("📥 Messages fetched for user " + currentUserId + ": " + messages);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/private/{otherUserId}")
    public ResponseEntity<List<Message>> getPrivateMessages(@PathVariable String otherUserId, Authentication authentication) {
        String currentUserId = authentication.getName();
        User currentUser = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        User otherUser = userRepository.findById(otherUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        List<String> commonChatIds = currentUser.getChatIds().stream()
                .filter(chatId -> otherUser.getChatIds().contains(chatId))
                .toList();

        String chatId;
        if (commonChatIds.isEmpty()) {
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
            chatId = commonChatIds.get(0);
        }

        List<Message> messages = messageRepository.findByChatIdAndIsDeletedFalse(chatId);
        System.out.println("📥 Private messages fetched between " + currentUserId + " et " + otherUserId + ": " + messages);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Message>> getGroupMessages(@PathVariable String groupId, Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        if (!user.getChatIds().contains(groupId)) {
            return ResponseEntity.status(403).body(null);
        }
        List<Message> messages = messageRepository.findByChatIdAndIsDeletedFalse(groupId);
        System.out.println("📥 Group messages fetched for group " + groupId + ": " + messages);
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Message> updateMessage(@PathVariable String id, @RequestBody Message updatedMessage, Authentication authentication) {
        String currentUserId = authentication.getName();
        Optional<Message> existingMessageOpt = messageRepository.findById(id);

        if (existingMessageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Message existingMessage = existingMessageOpt.get();
        if (!existingMessage.getFromUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).body(null);
        }

        existingMessage.setContent(updatedMessage.getContent());
        existingMessage.setTimestamp(Instant.now());
        Message savedMessage = messageRepository.save(existingMessage);
        chatHistoryService.recordMessageAction(savedMessage, "UPDATED");
        return ResponseEntity.ok(savedMessage);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String id, Authentication authentication) {
        String currentUserId = authentication.getName();
        Optional<Message> messageOpt = messageRepository.findById(id);

        if (messageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Message message = messageOpt.get();
        if (!message.getFromUserId().equals(currentUserId)) {
            return ResponseEntity.status(403).build();
        }

        message.setIsDeleted(true);
        messageRepository.save(message);
        chatHistoryService.recordMessageAction(message, "DELETED");
        System.out.println("✅ Message " + id + " marqué comme supprimé et historisé");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getAllReports(Authentication authentication) {
        String currentUserId = authentication.getName();
        if (!currentUserId.equals(DEVELOPER_ID)) {
            return ResponseEntity.status(403).build();
        }
        List<Report> reports = reportRepository.findByStatus("PENDING");
        System.out.println("📋 Signalements récupérés pour l'admin: " + reports);
        return ResponseEntity.ok(reports);
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<Report> resolveReport(@PathVariable String id, Authentication authentication) {
        String currentUserId = authentication.getName();
        if (!currentUserId.equals(DEVELOPER_ID)) {
            return ResponseEntity.status(403).build();
        }
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Report report = reportOpt.get();
        report.setStatus("RESOLVED");
        Report updatedReport = reportRepository.save(report);

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

    @PostMapping("/theme")
    public ResponseEntity<String> saveChatTheme(@RequestBody Map<String, String> themeData, Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        String theme = themeData.get("theme");
        List<String> validThemes = Arrays.asList("light", "dark");
        if (theme == null || !validThemes.contains(theme)) {
            return ResponseEntity.badRequest().body("Thème invalide. Les valeurs autorisées sont : light, dark.");
        }

        user.setChatTheme(theme);
        userRepository.save(user);
        System.out.println("🎨 Thème " + theme + " sauvegardé pour l'utilisateur " + currentUserId);
        return ResponseEntity.ok("Thème sauvegardé avec succès");
    }

    @GetMapping("/theme")
    public ResponseEntity<Map<String, String>> getChatTheme(Authentication authentication) {
        String currentUserId = authentication.getName();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        Map<String, String> response = new HashMap<>();
        String userTheme = user.getChatTheme();
        // Vérifie si le thème est valide, sinon retourne "light" par défaut
        List<String> validThemes = Arrays.asList("light", "dark");
        response.put("theme", validThemes.contains(userTheme) ? userTheme : "light");
        System.out.println("🎨 Thème récupéré pour l'utilisateur " + currentUserId + ": " + response.get("theme"));
        return ResponseEntity.ok(response);
    }
}