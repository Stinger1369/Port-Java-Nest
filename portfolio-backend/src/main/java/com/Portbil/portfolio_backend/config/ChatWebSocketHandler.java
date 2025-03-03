package com.Portbil.portfolio_backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.Portbil.portfolio_backend.entity.Message;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.MessageRepository;
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
import java.util.concurrent.ConcurrentHashMap;
import java.util.Optional;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

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
                sendPrivateMessage(fromUserId, toUserId, content, session);
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

    private void sendPrivateMessage(String fromUserId, String toUserId, String content, WebSocketSession fromSession) throws IOException {
        Optional<User> toUserOpt = userRepository.findById(toUserId);
        if (!toUserOpt.isPresent()) {
            fromSession.sendMessage(new TextMessage("{\"error\":\"Destinataire introuvable\"}"));
            System.out.println("❌ Destinataire " + toUserId + " introuvable, message non envoyé");
            return;
        }

        String chatId = getOrCreatePrivateChatId(fromUserId, toUserId);

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
        messageMap.put("id", msg.getId()); // Ajouter l’ID du message
        messageMap.put("type", "private");
        messageMap.put("fromUserId", fromUserId);
        messageMap.put("toUserId", toUserId);
        messageMap.put("chatId", chatId);
        messageMap.put("content", content);
        messageMap.put("timestamp", msg.getTimestamp().toString()); // Toujours ISO
        String messageJson = objectMapper.writeValueAsString(messageMap);

        WebSocketSession toSession = sessions.get(toUserId);
        if (toSession != null && toSession.isOpen()) {
            toSession.sendMessage(new TextMessage(messageJson)); // Envoyer uniquement au destinataire
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
        } else {
            sessions.get(fromUserId).sendMessage(new TextMessage("{\"error\":\"Utilisateur invité hors ligne\"}"));
        }
    }

    private void sendGroupMessage(String fromUserId, String groupId, String content) throws IOException {
        addChatIdToUser(fromUserId, groupId);
        for (Map.Entry<String, String> entry : groupMembers.entrySet()) {
            if (entry.getValue().equals(groupId)) {
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
            if (entry.getValue().equals(groupId)) {
                WebSocketSession memberSession = sessions.get(entry.getKey());
                if (memberSession != null && memberSession.isOpen()) {
                    memberSession.sendMessage(new TextMessage(messageJson));
                }
            }
        }
        WebSocketSession fromSession = sessions.get(fromUserId);
        if (fromSession != null && fromSession.isOpen()) {
            fromSession.sendMessage(new TextMessage(messageJson));
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

        for (String chatId : fromUser.getChatIds()) {
            if (toUser.getChatIds().contains(chatId)) {
                List<Message> messages = messageRepository.findByChatId(chatId);
                if (messages.stream().anyMatch(msg ->
                        (msg.getFromUserId().equals(fromUserId) && msg.getToUserId().equals(toUserId)) ||
                                (msg.getFromUserId().equals(toUserId) && msg.getToUserId().equals(fromUserId)))) {
                    System.out.println("🔍 ChatId existant trouvé: " + chatId);
                    return chatId;
                }
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