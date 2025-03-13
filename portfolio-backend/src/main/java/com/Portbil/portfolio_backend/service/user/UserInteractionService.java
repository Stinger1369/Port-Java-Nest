package com.Portbil.portfolio_backend.service.user;

import com.Portbil.portfolio_backend.config.ChatWebSocketHandler;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserInteractionService {

    private final UserRepository userRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final MessageSource messageSource;

    /**
     * Ajouter un like à un utilisateur
     */
    public void likeUser(String likerId, String likedId, Locale locale) {
        if (likerId == null || likedId == null || likerId.trim().isEmpty() || likedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }
        if (likerId.equals(likedId)) {
            throw new IllegalArgumentException(messageSource.getMessage("self.like", null, locale));
        }

        User liker = userRepository.findById(likerId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likerId}, locale)));
        User liked = userRepository.findById(likedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likedId}, locale)));

        if (liker.getLikedUserIds() == null) {
            liker.setLikedUserIds(new ArrayList<>());
        }
        if (liked.getLikerUserIds() == null) {
            liked.setLikerUserIds(new ArrayList<>());
        }

        if (liker.getLikedUserIds().contains(likedId)) {
            throw new IllegalStateException(messageSource.getMessage("already.liked", null, locale));
        }

        liker.getLikedUserIds().add(likedId);
        liked.getLikerUserIds().add(likerId);

        userRepository.save(liker);
        userRepository.save(liked);
        System.out.println("✅ Utilisateur " + likerId + " a liké " + likedId);

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("likerId", likerId);
            String likerName = Optional.ofNullable(liker.getFirstName())
                    .map(fn -> fn + " " + Optional.ofNullable(liker.getLastName()).orElse(""))
                    .orElse("Utilisateur inconnu");
            chatWebSocketHandler.sendNotification(
                    likedId,
                    "user_like",
                    likerName + " a liké votre profil !",
                    notificationData
            );
            chatWebSocketHandler.persistNotification(
                    likedId,
                    "user_like",
                    likerName + " a liké votre profil !",
                    notificationData
            );
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification de like : " + e.getMessage());
        }
    }

    /**
     * Retirer un like d'un utilisateur
     */
    public void unlikeUser(String likerId, String likedId, Locale locale) {
        if (likerId == null || likedId == null || likerId.trim().isEmpty() || likedId.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("invalid.user.ids", null, locale));
        }

        User liker = userRepository.findById(likerId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likerId}, locale)));
        User liked = userRepository.findById(likedId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{likedId}, locale)));

        if (liker.getLikedUserIds() == null || liked.getLikerUserIds() == null) {
            throw new IllegalStateException(messageSource.getMessage("inconsistent.like.data", null, locale));
        }

        if (!liker.getLikedUserIds().contains(likedId)) {
            throw new IllegalStateException(messageSource.getMessage("not.liked", null, locale));
        }

        liker.getLikedUserIds().remove(likedId);
        liked.getLikerUserIds().remove(likerId);

        userRepository.save(liker);
        userRepository.save(liked);
        System.out.println("✅ Utilisateur " + likerId + " a retiré son like de " + likedId);

        try {
            Map<String, String> notificationData = new HashMap<>();
            notificationData.put("likerId", likerId);
            String likerName = Optional.ofNullable(liker.getFirstName())
                    .map(fn -> fn + " " + Optional.ofNullable(liker.getLastName()).orElse(""))
                    .orElse("Utilisateur inconnu");
            chatWebSocketHandler.sendNotification(
                    likedId,
                    "user_unlike",
                    likerName + " a retiré son like de votre profil.",
                    notificationData
            );
            chatWebSocketHandler.persistNotification(
                    likedId,
                    "user_unlike",
                    likerName + " a retiré son like de votre profil.",
                    notificationData
            );
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification de unlike : " + e.getMessage());
        }
    }

    /**
     * Récupérer les IDs des chats d'un utilisateur
     */
    public List<String> getUserChatIds(String userId, Locale locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messageSource.getMessage("user.not.found", new Object[]{userId}, locale)));
        return user.getChatIds();
    }
}