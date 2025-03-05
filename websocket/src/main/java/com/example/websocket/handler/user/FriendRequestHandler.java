package com.example.websocket.handler.user;

import com.example.websocket.handler.WebSocketErrorHandler;
import com.example.websocket.model.Notification;
import com.example.websocket.service.UserService;
import com.example.websocket.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

@Component
public class FriendRequestHandler {
        private static final Logger logger = LoggerFactory.getLogger(FriendRequestHandler.class);
        private static final String USER_ID = "userId";
        private static final String FRIEND_ID = "friendId";
        private static final String FIRST_NAME = "firstName";
        private static final String LAST_NAME = "lastName";
        private static final String CONTENT = "content";
        private static final String SYSTEM = "System";
        private static final String NOTIFICATION = "Notification";

        private final UserService userService;
        private final NotificationService notificationService;

        public FriendRequestHandler(UserService userService,
                        NotificationService notificationService) {
                this.userService = userService;
                this.notificationService = notificationService;
        }

        public void handleSendFriendRequest(WebSocketSession session, JsonNode payload) {
                logger.info("Handling friend.request with payload: {}", payload);

                if (payload.hasNonNull(USER_ID) && payload.hasNonNull(FRIEND_ID)
                                && payload.hasNonNull(FIRST_NAME) && payload.hasNonNull(LAST_NAME)
                                && payload.hasNonNull(CONTENT)) {

                        String userId = payload.get(USER_ID).asText();
                        String friendId = payload.get(FRIEND_ID).asText();
                        String firstName = payload.get(FIRST_NAME).asText();
                        String lastName = payload.get(LAST_NAME).asText();
                        String content = payload.get(CONTENT).asText();

                        logger.info("User with userId: {} is sending friend request to friendId: {}",
                                        userId, friendId);

                        userService.sendFriendRequest(userId, friendId).subscribe(unused -> {
                                WebSocketErrorHandler.sendMessage(session, "friend.request.sent",
                                                null);
                                logger.info("Friend request sent from userId: {} to friendId: {}",
                                                userId, friendId);

                                // Create a notification
                                String message = String.format(
                                                "User %s %s sent you a friend request.", firstName,
                                                lastName);
                                Notification notification = new Notification(userId, firstName,
                                                lastName, message, content, "friend_request");

                                notificationService.createNotification(notification).subscribe();
                        }, error -> {
                                logger.error("Error sending friend request from userId: {} to friendId: {}",
                                                userId, friendId, error);
                                WebSocketErrorHandler.sendErrorMessage(session, error.getMessage(),
                                                error);
                        });
                } else {
                        logger.error("Missing fields in friend.request payload: userId={}, friendId={}, firstName={}, lastName={}, content={}",
                                        payload.hasNonNull(USER_ID), payload.hasNonNull(FRIEND_ID),
                                        payload.hasNonNull(FIRST_NAME),
                                        payload.hasNonNull(LAST_NAME), payload.hasNonNull(CONTENT));
                        WebSocketErrorHandler.sendErrorMessage(session,
                                        "Missing fields in friend.request payload");
                }
        }

        public void handleAcceptFriendRequest(WebSocketSession session, JsonNode payload) {
                logger.info("Handling friend.request.accept with payload: {}", payload);

                if (payload.hasNonNull(USER_ID) && payload.hasNonNull(FRIEND_ID)) {
                        String userId = payload.get(USER_ID).asText();
                        String friendId = payload.get(FRIEND_ID).asText();
                        logger.info("User with userId: {} is accepting friend request from friendId: {}",
                                        userId, friendId);

                        userService.acceptFriendRequest(userId, friendId).subscribe(unused -> {
                                WebSocketErrorHandler.sendMessage(session,
                                                "friend.request.accepted", null);
                                logger.info("Friend request accepted by userId: {} from friendId: {}",
                                                userId, friendId);

                                // Create a notification
                                String message = String.format(
                                                "User %s accepted your friend request.", userId);
                                Notification notification = new Notification(friendId, SYSTEM,
                                                NOTIFICATION, message, userId, "friend_accept");
                                notificationService.createNotification(notification).subscribe();
                        }, error -> {
                                logger.error("Error accepting friend request by userId: {} from friendId: {}",
                                                userId, friendId, error);
                                WebSocketErrorHandler.sendErrorMessage(session, error.getMessage(),
                                                error);
                        });
                } else {
                        logger.error("Missing fields in friend.request.accept payload: userId={}, friendId={}",
                                        payload.hasNonNull(USER_ID), payload.hasNonNull(FRIEND_ID));
                        WebSocketErrorHandler.sendErrorMessage(session,
                                        "Missing fields in friend.request.accept payload");
                }
        }

        public void handleDeclineFriendRequest(WebSocketSession session, JsonNode payload) {
                logger.info("Handling friend.request.decline with payload: {}", payload);

                if (payload.hasNonNull(USER_ID) && payload.hasNonNull(FRIEND_ID)) {
                        String userId = payload.get(USER_ID).asText();
                        String friendId = payload.get(FRIEND_ID).asText();
                        logger.info("User with userId: {} is declining friend request from friendId: {}",
                                        userId, friendId);

                        userService.declineFriendRequest(userId, friendId).subscribe(unused -> {
                                WebSocketErrorHandler.sendMessage(session,
                                                "friend.request.declined", null);
                                logger.info("Friend request declined by userId: {} from friendId: {}",
                                                userId, friendId);

                                // Create a notification
                                String message = String.format(
                                                "User %s declined your friend request.", userId);
                                Notification notification = new Notification(friendId, SYSTEM,
                                                NOTIFICATION, message, userId, "friend_decline");
                                notificationService.createNotification(notification).subscribe();
                        }, error -> {
                                logger.error("Error declining friend request by userId: {} from friendId: {}",
                                                userId, friendId, error);
                                WebSocketErrorHandler.sendErrorMessage(session, error.getMessage(),
                                                error);
                        });
                } else {
                        logger.error("Missing fields in friend.request.decline payload: userId={}, friendId={}",
                                        payload.hasNonNull(USER_ID), payload.hasNonNull(FRIEND_ID));
                        WebSocketErrorHandler.sendErrorMessage(session,
                                        "Missing fields in friend.request.decline payload");
                }
        }

        public void handleRemoveFriend(WebSocketSession session, JsonNode payload) {
                logger.info("Handling friend.remove with payload: {}", payload);

                if (payload.hasNonNull(USER_ID) && payload.hasNonNull(FRIEND_ID)) {
                        String userId = payload.get(USER_ID).asText();
                        String friendId = payload.get(FRIEND_ID).asText();
                        logger.info("User with userId: {} is removing friend with friendId: {}",
                                        userId, friendId);

                        userService.removeFriend(userId, friendId).subscribe(unused -> {
                                WebSocketErrorHandler.sendMessage(session, "friend.removed", null);
                                logger.info("Friend removed by userId: {} with friendId: {}",
                                                userId, friendId);

                                // Create a notification
                                String message = String.format(
                                                "User %s removed you from their friends list.",
                                                userId);
                                Notification notification = new Notification(friendId, SYSTEM,
                                                NOTIFICATION, message, userId, "friend_remove");
                                notificationService.createNotification(notification).subscribe();
                        }, error -> {
                                logger.error("Error removing friend by userId: {} with friendId: {}",
                                                userId, friendId, error);
                                WebSocketErrorHandler.sendErrorMessage(session, error.getMessage(),
                                                error);
                        });
                } else {
                        logger.error("Missing fields in friend.remove payload: userId={}, friendId={}",
                                        payload.hasNonNull(USER_ID), payload.hasNonNull(FRIEND_ID));
                        WebSocketErrorHandler.sendErrorMessage(session,
                                        "Missing fields in friend.remove payload");
                }
        }
}
