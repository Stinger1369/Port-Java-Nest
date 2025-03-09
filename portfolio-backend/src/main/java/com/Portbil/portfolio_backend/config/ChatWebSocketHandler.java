package com.Portbil.portfolio_backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.Portbil.portfolio_backend.entity.Message;
import com.Portbil.portfolio_backend.entity.Notification;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.MessageRepository;
import com.Portbil.portfolio_backend.repository.NotificationRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import com.Portbil.portfolio_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> groupInvitations = new ConcurrentHashMap<>();
    private final Map<String, String> groupMembers = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = extractUserId(session);
        if (userId != null) {
            sessions.put(userId, session);
            System.out.println("✅ Nouvelle connexion WebSocket pour userId: " + userId);
            session.sendMessage(new TextMessage("{\"type\":\"connected\",\"userId\":\"" + userId + "\"}"));
        } else {
            System.out.println("🚫 Connexion WebSocket rejetée: Authentification échouée");
            session.sendMessage(new TextMessage("{\"error\":\"Token invalide ou expiré, veuillez renouveler votre token\"}"));
            session.close(CloseStatus.BAD_DATA.withReason("Authentification requise"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        Map<String, String> data = objectMapper.readValue(payload, Map.class);
        String type = data.get("type");
        String fromUserId = extractUserId(session);

        if (fromUserId == null) {
            session.sendMessage(new TextMessage("{\"error\":\"Utilisateur non authentifié\"}"));
            return;
        }

        switch (type) {
            case "private":
                String toUserId = data.get("toUserId");
                String content = data.get("content");
                String receivedChatId = data.get("chatId");
                sendPrivateMessage(fromUserId, toUserId, content, receivedChatId, session);
                break;

            case "group_invite":
                String invitedUserId = data.get("invitedUserId");
                String groupId = data.get("groupId");
                inviteToGroup(fromUserId, invitedUserId, groupId);
                break;

            case "group_message":
                String groupIdForMessage = data.get("groupId");
                String groupContent = data.get("content");
                sendGroupMessage(fromUserId, groupIdForMessage, groupContent);
                break;

            default:
                session.sendMessage(new TextMessage("{\"error\":\"Type de message inconnu\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = extractUserId(session);
        if (userId != null) {
            sessions.remove(userId);
            groupMembers.remove(userId);
            System.out.println("🔴 Déconnexion WebSocket pour userId: " + userId);
        }
    }

    // Dans sendPrivateMessage
    private void sendPrivateMessage(String fromUserId, String toUserId, String content, String receivedChatId, WebSocketSession fromSession) throws IOException {
        Optional<User> toUserOpt = userRepository.findById(toUserId);
        if (!toUserOpt.isPresent()) {
            fromSession.sendMessage(new TextMessage("{\"error\":\"Destinataire introuvable\"}"));
            System.out.println("❌ Destinataire " + toUserId + " introuvable, message non envoyé");
            return;
        }

        String chatId = receivedChatId != null && !receivedChatId.startsWith("temp-") ? receivedChatId : getOrCreatePrivateChatId(fromUserId, toUserId);

        Message msg = Message.builder()
                .type("private")
                .fromUserId(fromUserId)
                .toUserId(toUserId)
                .chatId(chatId)
                .content(content)
                .timestamp(Instant.now())
                .build();
        messageRepository.save(msg);

        Map<String, String> messageMap = new HashMap<>();
        messageMap.put("id", msg.getId());
        messageMap.put("type", "private");
        messageMap.put("fromUserId", fromUserId);
        messageMap.put("toUserId", toUserId);
        messageMap.put("chatId", chatId);
        messageMap.put("content", content);
        messageMap.put("timestamp", msg.getTimestamp().toString());
        String messageJson = objectMapper.writeValueAsString(messageMap);

        WebSocketSession toSession = sessions.get(toUserId);
        if (toSession != null && toSession.isOpen()) {
            toSession.sendMessage(new TextMessage(messageJson));
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("chatId", chatId);
            notificationData.put("fromUserId", fromUserId);
            sendNotification(toUserId, "new_private_message", "Nouveau message privé de " + fromUserId, notificationData);
            persistNotification(toUserId, "new_private_message", "Nouveau message privé de " + fromUserId, notificationData);
        } else {
            Map<String, String> sentMessageMap = new HashMap<>();
            sentMessageMap.put("type", "message_sent");
            sentMessageMap.put("id", msg.getId());
            sentMessageMap.put("toUserId", toUserId);
            sentMessageMap.put("chatId", chatId);
            sentMessageMap.put("content", content);
            sentMessageMap.put("timestamp", msg.getTimestamp().toString());
            fromSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(sentMessageMap)));
            System.out.println("📤 Message envoyé à " + toUserId + " (hors ligne), sauvegardé dans MongoDB avec chatId: " + chatId);

            // Forcer l'envoi de la notification via WebSocket même si hors ligne (sera ignoré si pas connecté)
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("chatId", chatId);
            notificationData.put("fromUserId", fromUserId);
            sendNotification(toUserId, "new_private_message", "Nouveau message privé de " + fromUserId, notificationData);
            persistNotification(toUserId, "new_private_message", "Nouveau message privé de " + fromUserId, notificationData);
        }
    }

    // Dans sendGroupMessage (ajuster de manière similaire)
    private void sendGroupMessage(String fromUserId, String groupId, String content) throws IOException {
        addChatIdToUser(fromUserId, groupId);
        for (Map.Entry<String, String> entry : groupMembers.entrySet()) {
            if (entry.getValue().equals(groupId) && !entry.getKey().equals(fromUserId)) {
                addChatIdToUser(entry.getKey(), groupId);
            }
        }

        Message msg = Message.builder()
                .type("group_message")
                .fromUserId(fromUserId)
                .groupId(groupId)
                .chatId(groupId)
                .content(content)
                .timestamp(Instant.now())
                .build();
        messageRepository.save(msg);

        Map<String, String> messageMap = new HashMap<>();
        messageMap.put("id", msg.getId());
        messageMap.put("type", "group_message");
        messageMap.put("fromUserId", fromUserId);
        messageMap.put("groupId", groupId);
        messageMap.put("chatId", groupId);
        messageMap.put("content", content);
        messageMap.put("timestamp", msg.getTimestamp().toString());
        String messageJson = objectMapper.writeValueAsString(messageMap);

        for (Map.Entry<String, String> entry : groupMembers.entrySet()) {
            if (entry.getValue().equals(groupId) && !entry.getKey().equals(fromUserId)) {
                WebSocketSession memberSession = sessions.get(entry.getKey());
                if (memberSession != null && memberSession.isOpen()) {
                    memberSession.sendMessage(new TextMessage(messageJson));
                    Map<String, String> notificationData = new HashMap<>();
                    notificationData.put("groupId", groupId);
                    notificationData.put("fromUserId", fromUserId);
                    sendNotification(entry.getKey(), "new_group_message", "Nouveau message dans le groupe " + groupId + " de " + fromUserId, notificationData);
                    persistNotification(entry.getKey(), "new_group_message", "Nouveau message dans le groupe " + groupId + " de " + fromUserId, notificationData);
                } else {
                    Map<String, String> notificationData = new HashMap<>();
                    notificationData.put("groupId", groupId);
                    notificationData.put("fromUserId", fromUserId);
                    sendNotification(entry.getKey(), "new_group_message", "Nouveau message dans le groupe " + groupId + " de " + fromUserId, notificationData);
                    persistNotification(entry.getKey(), "new_group_message", "Nouveau message dans le groupe " + groupId + " de " + fromUserId, notificationData);
                }
            }
        }
        WebSocketSession fromSession = sessions.get(fromUserId);
        if (fromSession != null && fromSession.isOpen()) {
            fromSession.sendMessage(new TextMessage(messageJson));
        }
    }

    private void inviteToGroup(String fromUserId, String invitedUserId, String groupId) throws IOException {
        WebSocketSession invitedSession = sessions.get(invitedUserId);
        if (invitedSession != null && invitedSession.isOpen()) {
            groupInvitations.put(groupId + "_" + invitedUserId, invitedUserId);
            groupMembers.put(invitedUserId, groupId);

            addChatIdToUser(fromUserId, groupId);
            addChatIdToUser(invitedUserId, groupId);

            Map<String, String> inviteMessageMap = new HashMap<>();
            inviteMessageMap.put("type", "group_invite");
            inviteMessageMap.put("fromUserId", fromUserId);
            inviteMessageMap.put("invitedUserId", invitedUserId);
            inviteMessageMap.put("groupId", groupId);
            inviteMessageMap.put("timestamp", Instant.now().toString());
            String inviteMessage = objectMapper.writeValueAsString(inviteMessageMap);

            invitedSession.sendMessage(new TextMessage(inviteMessage));
            Map<String, String> inviteSentMap = new HashMap<>();
            inviteSentMap.put("type", "invite_sent");
            inviteSentMap.put("groupId", groupId);
            inviteSentMap.put("invitedUserId", invitedUserId);
            sessions.get(fromUserId).sendMessage(new TextMessage(objectMapper.writeValueAsString(inviteSentMap)));
            System.out.println("✅ Invitation envoyée à " + invitedUserId + " pour le groupe " + groupId);

            // Notification pour l'invité
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("groupId", groupId);
            notificationData.put("fromUserId", fromUserId);
            sendNotification(invitedUserId, "group_invite", "Vous avez été invité au groupe " + groupId + " par " + fromUserId, notificationData);
            persistNotification(invitedUserId, "group_invite", "Vous avez été invité au groupe " + groupId + " par " + fromUserId, notificationData);
        } else {
            sessions.get(fromUserId).sendMessage(new TextMessage("{\"error\":\"Utilisateur invité hors ligne\"}"));
            // Persister la notification pour l'utilisateur hors ligne
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("groupId", groupId);
            notificationData.put("fromUserId", fromUserId);
            persistNotification(invitedUserId, "group_invite", "Vous avez été invité au groupe " + groupId + " par " + fromUserId, notificationData);
        }
    }

    // Envoyer une notification
    public void sendNotification(String toUserId, String notificationType, String messageContent, Map<String, String> additionalData) throws IOException {
        WebSocketSession session = sessions.get(toUserId);
        if (session != null && session.isOpen()) {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "notification");
            notification.put("notificationType", notificationType);
            notification.put("message", messageContent);
            notification.put("timestamp", Instant.now().toString());
            if (additionalData != null) {
                notification.putAll(additionalData);
            }
            String notificationJson = objectMapper.writeValueAsString(notification);
            session.sendMessage(new TextMessage(notificationJson));
            System.out.println("📢 Notification envoyée à " + toUserId + ": " + notificationJson);
        } else {
            System.out.println("ℹ️ Utilisateur " + toUserId + " non connecté, notification non envoyée en temps réel.");
        }
    }

    // Persister une notification dans MongoDB (maintenant public)
    public void persistNotification(String toUserId, String notificationType, String messageContent, Map<String, String> additionalData) {
        try {
            Notification notification = Notification.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(toUserId)
                    .type(notificationType)
                    .message(messageContent)
                    .timestamp(Instant.now())
                    .isRead(false)
                    .data(additionalData != null ? additionalData : new HashMap<>())
                    .build();
            notificationRepository.save(notification);
            System.out.println("💾 Notification persistantée pour " + toUserId + ": " + notification.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la persistance de la notification pour " + toUserId + ": " + e.getMessage());
        }
    }

    private String extractUserId(WebSocketSession session) {
        String authHeader = session.getHandshakeHeaders().getFirst("Authorization");
        System.out.println("🔍 Received Authorization header: " + authHeader);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("🔍 Extracted JWT token from header: " + token);
            try {
                String userId = jwtUtil.extractUserId(token);
                System.out.println("🔍 Extracted userId from header: " + userId);
                return userId;
            } catch (Exception e) {
                System.out.println("🔴 Token invalide dans le header: " + e.getMessage());
            }
        }

        String query = session.getUri().getQuery();
        System.out.println("🔍 Query string: " + query);
        if (query != null && query.startsWith("token=")) {
            String token = query.substring(6);
            System.out.println("🔍 Extracted JWT token from URL: " + token);
            try {
                String userId = jwtUtil.extractUserId(token);
                System.out.println("🔍 Extracted userId from URL: " + userId);
                return userId;
            } catch (Exception e) {
                System.out.println("🔴 Token invalide dans l’URL: " + e.getMessage());
            }
        }

        System.out.println("🔴 No valid Authorization header or token found");
        return null;
    }

    private String getOrCreatePrivateChatId(String fromUserId, String toUserId) {
        User fromUser = userRepository.findById(fromUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable: " + fromUserId));
        User toUser = userRepository.findById(toUserId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable: " + toUserId));

        List<Message> existingMessages = messageRepository.findByTypeAndFromUserIdAndToUserId("private", fromUserId, toUserId);
        existingMessages.addAll(messageRepository.findByTypeAndFromUserIdAndToUserId("private", toUserId, fromUserId));
        if (!existingMessages.isEmpty()) {
            String existingChatId = existingMessages.get(0).getChatId();
            System.out.println("🔍 ChatId existant trouvé dans les messages: " + existingChatId);
            if (!fromUser.getChatIds().contains(existingChatId)) {
                fromUser.getChatIds().add(existingChatId);
                userRepository.save(fromUser);
            }
            if (!toUser.getChatIds().contains(existingChatId)) {
                toUser.getChatIds().add(existingChatId);
                userRepository.save(toUser);
            }
            return existingChatId;
        }

        for (String chatId : fromUser.getChatIds()) {
            if (toUser.getChatIds().contains(chatId)) {
                System.out.println("🔍 ChatId commun existant trouvé: " + chatId);
                return chatId;
            }
        }

        String newChatId = UUID.randomUUID().toString();
        addChatIdToUser(fromUserId, newChatId);
        addChatIdToUser(toUserId, newChatId);
        System.out.println("✅ Nouveau chatId créé: " + newChatId);
        return newChatId;
    }

    private void addChatIdToUser(String userId, String chatId) {
        try {
            User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable: " + userId));
            if (!user.getChatIds().contains(chatId)) {
                user.getChatIds().add(chatId);
                userRepository.save(user);
                System.out.println("✅ Added chatId " + chatId + " to user " + userId);
            } else {
                System.out.println("ℹ️ ChatId " + chatId + " déjà présent pour user " + userId);
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'ajout du chatId " + chatId + " à l'utilisateur " + userId + ": " + e.getMessage());
            throw e;
        }
    }

    public Map<String, String> getGroupMembers() {
        return groupMembers;
    }
}